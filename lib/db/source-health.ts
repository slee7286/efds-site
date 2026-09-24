import "server-only";

import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SourceRun = {
  status: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  failedCount: number;
  limited: boolean;
};

export type SourceHealth = {
  unavailable: boolean;
  enabledSlackChannels: number;
  oldestSlackSyncAt: string | null;
  slackRun: SourceRun | null;
  meetingsRun: SourceRun | null;
  icuRun: SourceRun | null;
};

const empty: SourceHealth = {
  unavailable: false,
  enabledSlackChannels: 0,
  oldestSlackSyncAt: null,
  slackRun: null,
  meetingsRun: null,
  icuRun: null,
};

function run(row: Record<string, unknown> | undefined): SourceRun | null {
  if (!row) return null;
  return {
    status: typeof row.status === "string" ? row.status : null,
    startedAt: typeof row.started_at === "string" ? row.started_at : null,
    finishedAt: typeof row.finished_at === "string" ? row.finished_at : null,
    failedCount: typeof row.records_failed === "number" ? row.records_failed : 0,
    limited: Boolean(row.metadata && typeof row.metadata === "object" && (row.metadata as Record<string, unknown>).max_articles != null),
  };
}

export function oldestCompleteSync(rows: { last_successful_sync_at: string | null }[]): string | null {
  if (!rows.length || rows.some((row) => !row.last_successful_sync_at || !Number.isFinite(Date.parse(row.last_successful_sync_at)))) return null;
  return rows.reduce((oldest, row) => Date.parse(row.last_successful_sync_at!) < Date.parse(oldest) ? row.last_successful_sync_at! : oldest, rows[0].last_successful_sync_at!);
}

export function syncState(lastSuccessAt: string | null, latestRun: SourceRun | null, now = Date.now(), overdueHours = 15): "fresh" | "overdue" | "failed" | "refreshing" {
  if (latestRun?.status === "failed" || latestRun?.status === "completed_with_errors" || latestRun?.failedCount) return "failed";
  if (latestRun?.status === "running") {
    const started = latestRun.startedAt ? Date.parse(latestRun.startedAt) : NaN;
    return Number.isFinite(started) && now >= started && now - started < 90 * 60 * 1000 ? "refreshing" : "failed";
  }
  if (!lastSuccessAt || !Number.isFinite(Date.parse(lastSuccessAt)) || now - Date.parse(lastSuccessAt) >= overdueHours * 60 * 60 * 1000) return "overdue";
  return "fresh";
}

export async function getSourceHealth(): Promise<SourceHealth> {
  if (!isSupabaseConfigured) return empty;
  await requireRole("admin");
  try {
    const supabase = await createServerSupabaseClient();
    const latestRun = (source: string) => supabase.from("ingestion_runs")
      .select("status,started_at,finished_at,records_failed,metadata")
      .eq("source_type", source).order("started_at", { ascending: false }).limit(1);
    const [channels, slack, meetings, icu] = await Promise.all([
      supabase.from("slack_channel_sync_settings").select("last_successful_sync_at").eq("enabled", true),
      latestRun("slack"),
      latestRun("google_docs_meetings"),
      latestRun("icu_freshdesk"),
    ]);
    if (channels.error || slack.error || meetings.error || icu.error) throw new Error("source_health_query_failed");
    const enabled = channels.data ?? [];
    return {
      unavailable: false,
      enabledSlackChannels: enabled.length,
      oldestSlackSyncAt: oldestCompleteSync(enabled),
      slackRun: run(slack.data?.[0]),
      meetingsRun: run(meetings.data?.[0]),
      icuRun: run(icu.data?.[0]),
    };
  } catch {
    console.error("Source health could not be loaded");
    return { ...empty, unavailable: true };
  }
}
