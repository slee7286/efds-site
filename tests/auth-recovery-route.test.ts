import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession, getUser, signOut, getAccessException, provisionAuthenticatedProfile, evaluateUserAccess, supabase } = vi.hoisted(() => {
  const exchangeCodeForSession = vi.fn();
  const getUser = vi.fn();
  const signOut = vi.fn();
  const getAccessException = vi.fn();
  const provisionAuthenticatedProfile = vi.fn();
  const evaluateUserAccess = vi.fn();
  return { exchangeCodeForSession, getUser, signOut, getAccessException, provisionAuthenticatedProfile, evaluateUserAccess, supabase: { auth: { exchangeCodeForSession, getUser, signOut } } };
});

vi.mock("server-only", () => ({}));
vi.mock("../lib/config", () => ({ config: { siteUrl: "https://www.imperial-efds.com" }, isSupabaseConfigured: true }));
vi.mock("../lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => supabase) }));
vi.mock("../lib/auth/server", () => ({
  getAccessException,
  provisionAuthenticatedProfile,
  evaluateUserAccess,
  usesMicrosoftAuthentication: vi.fn(() => false),
}));

import { GET } from "../app/auth/recovery/route";

describe("password recovery callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset().mockResolvedValue({ error: null });
    getUser.mockReset().mockResolvedValue({ data: { user: { id: "user-1", email: "approved@example.com" } } });
    signOut.mockReset().mockResolvedValue({ error: null });
    getAccessException.mockReset().mockResolvedValue({ accessRole: "member", active: true });
    provisionAuthenticatedProfile.mockReset().mockResolvedValue({ accessRole: "member", active: true });
    evaluateUserAccess.mockReset().mockResolvedValue({ allowed: true });
  });

  it("exchanges the code and opens the password form with the same authenticated client", async () => {
    const response = await GET(new Request("https://www.imperial-efds.com/auth/recovery?code=test-code&flow=reset"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("test-code");
    expect(getUser).toHaveBeenCalled();
    expect(getAccessException).toHaveBeenCalledWith("approved@example.com", supabase);
    expect(provisionAuthenticatedProfile).toHaveBeenCalledWith({ id: "user-1", email: "approved@example.com" }, supabase);
    expect(evaluateUserAccess).toHaveBeenCalledWith({ id: "user-1", email: "approved@example.com" }, supabase);
    expect(response.headers.get("location")).toBe("https://www.imperial-efds.com/auth/set-password?flow=reset");
    expect(signOut).not.toHaveBeenCalled();
  });

  it("returns expired codes to sign-in without provisioning an account", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "expired" } });
    const response = await GET(new Request("https://www.imperial-efds.com/auth/recovery?code=expired&flow=reset"));
    expect(response.headers.get("location")).toBe("https://www.imperial-efds.com/login?error=recovery_expired");
    expect(provisionAuthenticatedProfile).not.toHaveBeenCalled();
  });
});
