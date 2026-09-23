import { describe, expect, it, vi } from "vitest";
import {
  getGoogleOAuthOptions,
  GOOGLE_AUTH_PROVIDER,
} from "../lib/auth/google";
import { getExternalAuthRedirect, getExternalMagicLinkOptions } from "../lib/auth/external";
import { getSiteUrl } from "../lib/config";

describe("Google authentication request", () => {
  it("constructs a same-origin callback URL without accepting a path or query", () => {
    expect(GOOGLE_AUTH_PROVIDER).toBe("google");
    expect(getGoogleOAuthOptions("https://efds.example/login?next=/admin")).toEqual({
      redirectTo: "https://efds.example/auth/callback",
    });
    expect(() => getGoogleOAuthOptions("javascript:alert(1)")).toThrow();
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
