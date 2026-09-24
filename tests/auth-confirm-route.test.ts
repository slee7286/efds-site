import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { verifyOtp, signOut, provisionAuthenticatedProfile, evaluateUserAccess, supabase } = vi.hoisted(() => {
  const verifyOtp = vi.fn();
  const signOut = vi.fn();
  return { verifyOtp, signOut, provisionAuthenticatedProfile: vi.fn(), evaluateUserAccess: vi.fn(), supabase: { auth: { verifyOtp, signOut } } };
});
vi.mock("server-only", () => ({}));
vi.mock("../lib/config", () => ({ config: { siteUrl: "https://www.imperial-efds.com" }, isSupabaseConfigured: true }));
vi.mock("../lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => supabase) }));
vi.mock("../lib/auth/server", () => ({ provisionAuthenticatedProfile, evaluateUserAccess }));

import { GET, HEAD, POST } from "../app/auth/confirm/route";
import { GET as callback } from "../app/auth/callback/route";
import { GET as recovery } from "../app/auth/recovery/route";

const origin = "https://www.imperial-efds.com";
const token = "a".repeat(64);
const user = { id: "existing-auth-user", email: "member@imperial.ac.uk", email_confirmed_at: "2026-09-23" };

async function confirmation(type = "email", next = "/dashboard") {
  const response = GET(new Request(`${origin}/auth/confirm?${new URLSearchParams({ token_hash: token, type, next })}`));
  const html = await response.text();
  const fields = Object.fromEntries([...html.matchAll(/name="([^"]+)" value="([^"]*)"/g)].map((match) => [match[1], match[2]]));
  return { response, html, fields, cookie: `efds-email-confirmation=${response.cookies.get("efds-email-confirmation")!.value}` };
}

function submission(fields: Record<string, string>, cookie: string, requestOrigin = origin) {
  return new NextRequest(`${origin}/auth/confirm`, { method: "POST", headers: { origin: requestOrigin, cookie }, body: new URLSearchParams(fields) });
}

describe("email confirmation that requires a deliberate submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyOtp.mockResolvedValue({ data: { user, session: { access_token: "test-session" } }, error: null });
    signOut.mockResolvedValue({ error: null });
    provisionAuthenticatedProfile.mockResolvedValue({ id: "existing-profile", accessRole: "committee", active: true });
    evaluateUserAccess.mockResolvedValue({ allowed: true });
  });

  it("allows repeated scanner GET/HEAD visits without consuming a token or provisioning a profile", async () => {
    await confirmation();
    const { response, html } = await confirmation();
    expect(HEAD().status).toBe(200);
    expect(response.status).toBe(200);
    expect(html).toContain('method="post"');
    expect(html).toContain("Continue to sign in");
    expect(html).not.toContain("<script");
    expect(response.headers.get("cache-control")).toContain("no-store");
    // Native form POSTs need an Origin; no-referrer would replace it with null.
    // strict-origin still prevents the credential's path/query leaking.
    expect(response.headers.get("referrer-policy")).toBe("strict-origin");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(provisionAuthenticatedProfile).not.toHaveBeenCalled();
  });

  it("does not consume an email-change token during a scanner visit", async () => {
    const { response, html } = await confirmation("email_change");
    expect(response.status).toBe(200);
    expect(html).toContain("Confirm this address");
    expect(html).toContain("confirm that link too");
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it.each([
    ["email", "/dashboard", "/dashboard"],
    ["email", `${origin}/auth/recovery?flow=setup`, "/auth/set-password?flow=setup"],
    ["recovery", "/", "/auth/set-password?flow=reset"],
    ["email_change", "/dashboard", "/dashboard"],
  ])("completes %s verification for an existing Auth account and routes to %s", async (type, next, destination) => {
    const { fields, cookie } = await confirmation(type, next);
    const response = await POST(submission(fields, cookie));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: token, type });
    expect(provisionAuthenticatedProfile).toHaveBeenCalledWith(user, supabase);
    expect(evaluateUserAccess).toHaveBeenCalledWith(user, supabase);
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}${destination}`);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("allows a member without an application profile to be provisioned after verification", async () => {
    provisionAuthenticatedProfile.mockResolvedValue({ id: "new-profile", accessRole: "member", active: true });
    const { fields, cookie } = await confirmation("email", "/auth/recovery?flow=setup");
    expect((await POST(submission(fields, cookie))).headers.get("location")).toBe(`${origin}/auth/set-password?flow=setup`);
    expect(provisionAuthenticatedProfile).toHaveBeenCalledWith(user, supabase);
  });

  it.each(["https://attacker.example", "null", ""])("rejects untrusted Origin %s before verification", async (requestOrigin) => {
    const { fields, cookie } = await confirmation();
    const request = submission(fields, cookie, requestOrigin);
    if (!requestOrigin) request.headers.delete("origin");
    expect((await POST(request)).status).toBe(403);
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("rejects missing or mismatched confirmation cookies before verification", async () => {
    const { fields } = await confirmation();
    for (const cookie of ["", `efds-email-confirmation=${"b".repeat(64)}`, `efds-email-confirmation=${"é".repeat(64)}`]) {
      expect((await POST(submission(fields, cookie))).headers.get("location")).toBe(`${origin}/login?error=auth_link_invalid`);
    }
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("does not accept arbitrary verification types or unsafe token markup", () => {
    for (const query of ["token_hash=" + token + "&type=invite", "token_hash=%3Cscript%3E&type=email"]) {
      expect(GET(new Request(`${origin}/auth/confirm?${query}`)).headers.get("location")).toBe(`${origin}/login?error=auth_link_invalid`);
    }
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("ignores external redirect destinations", async () => {
    const { fields, cookie } = await confirmation("email", "https://attacker.example/auth/recovery?flow=setup");
    expect((await POST(submission(fields, cookie))).headers.get("location")).toBe(`${origin}/dashboard`);
  });

  it("explains expired or consumed links without creating a profile", async () => {
    verifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: { code: "otp_expired" } });
    const { fields, cookie } = await confirmation();
    expect((await POST(submission(fields, cookie))).headers.get("location")).toBe(`${origin}/login?error=auth_link_expired&flow=magic`);
    const setup = await confirmation("email", `${origin}/auth/recovery?flow=setup`);
    expect((await POST(submission(setup.fields, setup.cookie))).headers.get("location")).toBe(`${origin}/login?error=auth_link_expired&flow=setup`);
    expect(provisionAuthenticatedProfile).not.toHaveBeenCalled();
  });

  it("treats the first secure email-change confirmation as pending the other address", async () => {
    verifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: null });
    const { fields, cookie } = await confirmation("email_change");
    const response = await POST(submission(fields, cookie));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: token, type: "email_change" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(`${origin}/auth/email-change-pending`);
    expect(response.cookies.get("efds-email-confirmation")?.value).toBe("");
    expect(provisionAuthenticatedProfile).not.toHaveBeenCalled();
    expect(evaluateUserAccess).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does not silently accept an empty session from other verification flows", async () => {
    verifyOtp.mockResolvedValue({ data: { user: null, session: null }, error: null });
    const { fields, cookie } = await confirmation("email");
    expect((await POST(submission(fields, cookie))).headers.get("location")).toBe(`${origin}/login?error=auth_link_expired&flow=magic`);
    expect(provisionAuthenticatedProfile).not.toHaveBeenCalled();
  });

  it("retains EFDS eligibility checks after verifying ownership of the email", async () => {
    provisionAuthenticatedProfile.mockResolvedValue(null);
    evaluateUserAccess.mockResolvedValue({ allowed: false });
    const { fields, cookie } = await confirmation();
    expect((await POST(submission(fields, cookie))).headers.get("location")).toBe(`${origin}/access-denied`);
    expect(signOut).toHaveBeenCalled();
  });

  it("does not call missing callback codes a configuration outage", async () => {
    expect((await callback(new Request(`${origin}/auth/callback`))).headers.get("location")).toBe(`${origin}/login?error=auth_link_expired`);
    expect((await recovery(new Request(`${origin}/auth/recovery?error=access_denied&error_code=otp_expired`))).headers.get("location")).toBe(`${origin}/login?error=recovery_expired`);
    expect(verifyOtp).not.toHaveBeenCalled();
  });
});
