import { describe, expect, it, vi } from "vitest";
import {
  AUTH_CALLBACK_PATH,
  getMicrosoftOAuthOptions,
  MICROSOFT_AUTH_PROVIDER,
  MICROSOFT_AUTH_SCOPES,
} from "../lib/auth/microsoft";
import { getExternalAuthRedirect, getExternalMagicLinkOptions } from "../lib/auth/external";
import { getSiteUrl } from "../lib/config";

describe("Microsoft authentication request", () => {
  it("leaves Supabase's required openid scope to the Azure provider", () => {
    expect(MICROSOFT_AUTH_PROVIDER).toBe("azure");
    expect(MICROSOFT_AUTH_SCOPES).toBe("profile email");
    expect(MICROSOFT_AUTH_SCOPES.split(" ")).toEqual(["profile", "email"]);
  });

  it("produces the desired effective OIDC scopes with Supabase's Azure default", () => {
    const effectiveScopes = ["openid", ...MICROSOFT_AUTH_SCOPES.split(" ")];
    expect(effectiveScopes).toEqual(["openid", "profile", "email"]);
    expect(new Set(effectiveScopes).size).toBe(effectiveScopes.length);
  });

  it("does not request Microsoft Graph or refresh-token permissions", () => {
    const scopes = MICROSOFT_AUTH_SCOPES.split(" ");
    expect(scopes).not.toContain("offline_access");
    expect(scopes).not.toContain("User.Read");
    expect(scopes.every((scope) => ["profile", "email"].includes(scope))).toBe(true);
  });

  it("constructs a same-origin callback URL without accepting a path or query", () => {
    expect(getMicrosoftOAuthOptions("https://efds.example/login?next=/admin")).toEqual({
      scopes: MICROSOFT_AUTH_SCOPES,
      redirectTo: `https://efds.example${AUTH_CALLBACK_PATH}`,
    });
    expect(() => getMicrosoftOAuthOptions("javascript:alert(1)")).toThrow();
  });
});

describe("external magic-link authentication", () => {
  it("continues to return the EFDS callback URL", () => {
    expect(getExternalMagicLinkOptions("https://efds.example")).toEqual({
      emailRedirectTo: "https://efds.example/auth/callback",
    });
  });

  it("uses the canonical recovery URL for setup and reset", () => {
    expect(getExternalAuthRedirect("https://www.imperial-efds.com", "setup")).toBe("https://www.imperial-efds.com/auth/recovery?flow=setup");
    expect(getExternalAuthRedirect("https://www.imperial-efds.com", "reset")).toBe("https://www.imperial-efds.com/auth/recovery?flow=reset");
    expect(getExternalAuthRedirect("https://www.imperial-efds.com", "magic_link")).toBe("https://www.imperial-efds.com/auth/callback");
    vi.stubEnv("NODE_ENV", "production");
    expect(getSiteUrl()).toBe("https://www.imperial-efds.com");
  });
});
