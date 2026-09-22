import { afterEach, describe, expect, it, vi } from "vitest";

const config = vi.hoisted(() => ({ configured: false }));
vi.mock("@/lib/config", () => ({ get isSupabaseConfigured() { return config.configured; } }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
import { readPageData } from "../lib/local-preview";

afterEach(() => { vi.unstubAllEnvs(); config.configured = false; });

describe("page-only local preview boundary", () => {
  it("renders empty development fixtures without calling a protected reader", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const read = vi.fn(async () => ["private record"]);
    expect(await readPageData(read, [])).toEqual([]);
    expect(read).not.toHaveBeenCalled();
  });
  it.each(["development", "production"])("preserves the reader's authorization in configured %s", async mode => {
    vi.stubEnv("NODE_ENV", mode);
    config.configured = true;
    const read = vi.fn(async (): Promise<string[]> => { throw new Error("Admin role required"); });
    await expect(readPageData(read, [])).rejects.toThrow("Admin role required");
    expect(read).toHaveBeenCalledOnce();
  });
  it.each(["production", "test"])("does not expose a preview in %s", async mode => {
    vi.stubEnv("NODE_ENV", mode);
    const read = vi.fn(async () => ["private record"]);
    await expect(readPageData(read, [])).rejects.toThrow("redirect:/access-denied");
    expect(read).not.toHaveBeenCalled();
  });
});
