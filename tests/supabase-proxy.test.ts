import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[], headers: Record<string, string>) => void } }) => ({
    auth: {
      getClaims: async () => {
        options.cookies.setAll([
          { name: "sb-access.0", value: "first", options: { httpOnly: true } },
          { name: "sb-access.1", value: "second", options: { httpOnly: true } },
        ], { "cache-control": "private, no-store" });
        return { data: { user: null }, error: null };
      },
    },
  }),
}));
vi.mock("../lib/config", () => ({ config: { supabaseUrl: "https://example.supabase.co", supabaseAnonKey: "public-key" } }));

import { proxy } from "../proxy";

describe("Supabase proxy", () => {
  it("returns every refreshed session cookie and the private cache header", async () => {
    const response = await proxy(new NextRequest("https://www.imperial-efds.com/dashboard"));
    expect(response.cookies.get("sb-access.0")?.value).toBe("first");
    expect(response.cookies.get("sb-access.1")?.value).toBe("second");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("rescues a recovery code that Supabase sent to the site root", async () => {
    const request = new NextRequest("https://www.imperial-efds.com/?code=test-code");
    request.cookies.set("efds-email-flow", "reset");
    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://www.imperial-efds.com/auth/recovery?code=test-code&flow=reset");
    expect(response.cookies.get("efds-email-flow")?.value).toBe("");
  });

  it("routes an unclassified root callback to normal sign-in", async () => {
    const response = await proxy(new NextRequest("https://www.imperial-efds.com/?code=test-code"));
    expect(response.headers.get("location")).toBe("https://www.imperial-efds.com/auth/callback?code=test-code");
  });
});
