import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/server", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

import { oldestCompleteSync, syncState, type SourceRun } from "@/lib/db/source-health";

const now = Date.parse("2026-09-24T12:00:00Z");
const completed: SourceRun = { status: "completed", startedAt: "2026-09-24T07:55:00Z", finishedAt: "2026-09-24T08:00:00Z", failedCount: 0, limited: false };

describe("source sync health", () => {
  it("uses the oldest enabled channel checkpoint so one missed channel cannot look fresh", () => {
    const oldest = oldestCompleteSync([
      { last_successful_sync_at: "2026-09-23T18:00:00Z" },
      { last_successful_sync_at: "2026-09-24T08:00:00Z" },
    ]);
    expect(oldest).toBe("2026-09-23T18:00:00Z");
    expect(syncState(oldest, completed, now)).toBe("overdue");
    expect(oldestCompleteSync([{ last_successful_sync_at: null }, { last_successful_sync_at: "2026-09-24T08:00:00Z" }])).toBeNull();
  });

  it("makes a failed or partial latest import visible despite a fresh prior checkpoint", () => {
    expect(syncState(completed.finishedAt, { ...completed, status: "completed_with_errors", failedCount: 1 }, now)).toBe("failed");
    expect(syncState(completed.finishedAt, completed, now)).toBe("fresh");
  });

  it("distinguishes a live refresh from an overdue stalled run", () => {
    expect(syncState(completed.finishedAt, { ...completed, status: "running", startedAt: "2026-09-24T11:45:00Z" }, now)).toBe("refreshing");
    expect(syncState(completed.finishedAt, { ...completed, status: "running", startedAt: "2026-09-24T10:00:00Z" }, now)).toBe("failed");
  });
});
