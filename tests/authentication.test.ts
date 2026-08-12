import { describe, expect, it } from "vitest";
import {
  AUTH_CALLBACK_PATH,
  getMicrosoftOAuthOptions,
  MICROSOFT_AUTH_PROVIDER,
  MICROSOFT_AUTH_SCOPES,
} from "../lib/auth/microsoft";
import { getExternalMagicLinkOptions } from "../lib/auth/external";

describe("Microsoft authentication request", () => {
  it("uses the Azure provider and only the minimum identity scopes", () => {
    expect(MICROSOFT_AUTH_PROVIDER).toBe("azure");
    expect(MICROSOFT_AUTH_SCOPES).toBe("openid profile email");
    expect(MICROSOFT_AUTH_SCOPES.split(" ")).toEqual(["openid", "profile", "email"]);
  });

  it("does not request Microsoft Graph data permissions", () => {
    const scopes = MICROSOFT_AUTH_SCOPES.split(" ");
    expect(scopes).not.toContain("offline_access");
    expect(scopes).not.toContain("User.Read");
    expect(scopes.every((scope) => ["openid", "profile", "email"].includes(scope))).toBe(true);
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
});
