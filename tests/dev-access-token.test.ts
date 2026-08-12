import { afterEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();

vi.mock("../lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getSession } })),
}));

import { GET } from "../app/api/dev/access-token/route";

describe("development access-token endpoint", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    getSession.mockReset();
  });

  it("returns the current session access token in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    getSession.mockResolvedValue({ data: { session: { access_token: "dev-token" } }, error: null });

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ access_token: "dev-token" });
  });

  it("does not expose a token outside development", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await GET();

    expect(response.status).toBe(404);
    expect(getSession).not.toHaveBeenCalled();
  });

  it("returns unauthorized when there is no development session", async () => {
    vi.stubEnv("NODE_ENV", "development");
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const response = await GET();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
