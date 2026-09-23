import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const resetPasswordForEmail = vi.fn();
const signInWithOtp = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("../lib/config", () => ({
  config: { siteUrl: "http://localhost:4587", allowedEmailDomains: ["ic.ac.uk", "imperial.ac.uk"] },
  isSupabaseConfigured: true,
}));
vi.mock("../lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc, auth: { resetPasswordForEmail, signInWithOtp } })),
}));

import { POST as requestPasswordEmail } from "../app/api/auth/external/password-email/route";

describe("external password email endpoint", () => {
  beforeEach(() => {
    rpc.mockReset();
    resetPasswordForEmail.mockReset();
    signInWithOtp.mockReset();
    resetPasswordForEmail.mockResolvedValue({ error: null });
    signInWithOtp.mockResolvedValue({ error: null });
  });

  it("sends recovery mail only for an eligible exception", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const response = await requestPasswordEmail(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ email: " Person@Example.com ", flow: "setup" }) }));

    expect(response.status).toBe(200);
    expect(response.cookies.get("efds-email-flow")?.value).toBe("setup");
    expect(signInWithOtp).toHaveBeenCalledWith({ email: "person@example.com", options: { emailRedirectTo: "http://localhost:4587/auth/recovery?flow=setup" } });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("uses password recovery for an existing account", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const response = await requestPasswordEmail(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ email: "person@example.com", flow: "reset" }) }));

    expect(response.status).toBe(200);
    expect(response.cookies.get("efds-email-flow")?.value).toBe("reset");
    expect(resetPasswordForEmail).toHaveBeenCalledWith("person@example.com", { redirectTo: "http://localhost:4587/auth/recovery?flow=reset" });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("maps a Supabase email rate limit without exposing its raw error", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    signInWithOtp.mockResolvedValue({ error: { status: 429, message: "rate limit exceeded: internal detail" } });
    const response = await requestPasswordEmail(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ email: "person@example.com", flow: "setup" }) }));

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ message: "Too many authentication emails have been requested. Please wait before requesting another email.", code: "AUTH_RATE_LIMITED" });
  });

  it("does not reveal or send mail for an ineligible address", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const response = await requestPasswordEmail(new Request("http://localhost/api", { method: "POST", body: JSON.stringify({ email: "unknown@example.com", flow: "reset" }) }));

    expect(response.status).toBe(200);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
    expect(response.cookies.get("efds-email-flow")).toBeUndefined();
    await expect(response.json()).resolves.toEqual({ message: "If this email is eligible for EFDS access, you will receive an email with the next step." });
  });
});

describe("provider-aware EFDS access", () => {
  afterEach(() => vi.restoreAllMocks());

  it("allows Imperial Microsoft authentication without an exception", async () => {
    const { resolveAuthenticatedAccess } = await import("../lib/auth/server");
    const decision = resolveAuthenticatedAccess({ email: "user@imperial.ac.uk", app_metadata: { provider: "azure" }, identities: [], email_confirmed_at: "now" } as never, null);
    expect(decision).toMatchObject({ allowed: true, accessRole: "member", memberType: "imperial" });
  });

  it("requires an active exception for Imperial email/password authentication", async () => {
    const { resolveAuthenticatedAccess } = await import("../lib/auth/server");
    const user = { email: "user@imperial.ac.uk", app_metadata: { provider: "email" }, identities: [], email_confirmed_at: "now" } as never;
    expect(resolveAuthenticatedAccess(user, null).allowed).toBe(false);
    expect(resolveAuthenticatedAccess(user, { email: "user@imperial.ac.uk", accessRole: "member", active: true }).allowed).toBe(true);
  });
});
