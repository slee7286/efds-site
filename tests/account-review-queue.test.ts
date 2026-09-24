import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryLog = { table: string; filters: [string, unknown][] };
const { logs, requireRole } = vi.hoisted(() => ({ logs: [] as QueryLog[], requireRole: vi.fn() }));
vi.mock("@/lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/auth/server", () => ({ requireRole }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({
    from(table: string) {
      const log: QueryLog = { table, filters: [] };
      logs.push(log);
      const query = {
        select: () => query, order: () => query, range: () => query, limit: () => query,
        eq: (field: string, value: unknown) => { log.filters.push([field, value]); return query; },
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: [], count: 0, error: null }).then(resolve),
      };
      return query;
    },
  })),
}));

import { getAccountReviewData } from "@/lib/db/accounts";

describe("account review queues", () => {
  beforeEach(() => { logs.length = 0; vi.clearAllMocks(); });

  it("keeps confirmed standard members out of Needs review", async () => {
    await getAccountReviewData("pending");
    expect(requireRole).toHaveBeenCalledWith("admin");
    const profileQueries = logs.filter((log) => log.table === "profiles");
    expect(profileQueries[0].filters).toContainEqual(["efds_verification_status", "pending"]);
    expect(profileQueries[0].filters).not.toContainEqual(["efds_verification_status", "declined"]);
  });

  it("lists the standard-member decision separately for later promotion", async () => {
    await getAccountReviewData("standard");
    const profileQueries = logs.filter((log) => log.table === "profiles");
    expect(profileQueries[0].filters).toContainEqual(["efds_verification_status", "declined"]);
    expect(profileQueries[0].filters).toContainEqual(["access_role", "member"]);
  });
});
