import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
  evaluateUserAccess: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); }),
}));

vi.mock("next/navigation", () => ({ redirect: auth.redirect }));
vi.mock("@/lib/auth/server", () => ({ getAuthUser: auth.getAuthUser, evaluateUserAccess: auth.evaluateUserAccess }));
vi.mock("@/lib/config", () => ({ isSupabaseConfigured: true, config: { siteUrl: "https://www.imperial-efds.com" } }));
vi.mock("@/lib/auth/provider-availability", () => ({ isGoogleSignInAvailable: async () => false }));

import LoginPage from "../app/(auth)/login/page";

describe("login with an existing session", () => {
  beforeEach(() => {
    auth.getAuthUser.mockReset();
    auth.evaluateUserAccess.mockReset();
    auth.redirect.mockClear();
  });

  it("opens the workspace for an already authorised account", async () => {
    auth.getAuthUser.mockResolvedValue({ id: "member-id" });
    auth.evaluateUserAccess.mockResolvedValue({ allowed: true });
    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/dashboard");
    expect(auth.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("keeps the login form available when there is no session", async () => {
    auth.getAuthUser.mockResolvedValue(null);
    const page = await LoginPage({ searchParams: Promise.resolve({}) });
    expect(page.type).toBe("main");
    expect(auth.redirect).not.toHaveBeenCalled();
  });
});
