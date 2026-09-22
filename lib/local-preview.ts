import "server-only";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import type { getDocumentDashboard } from "@/lib/db/documents";
import type { getSlackDashboard } from "@/lib/db/slack";
import type { getMeetingDashboard } from "@/lib/db/meetings";
import type { getOperationsDashboard } from "@/lib/db/operations";

/** Page presentation only. Configured readers retain their own auth and RLS checks. */
export async function readPageData<T>(load: () => Promise<T>, preview: NoInfer<T>): Promise<T> {
  if (isSupabaseConfigured) return load();
  if (process.env.NODE_ENV === "development") return preview;
  redirect("/access-denied");
}

// Empty development fixtures never represent records or create a user session.
export const documentPreview: Awaited<ReturnType<typeof getDocumentDashboard>> = {
  counts: { files: 0, current: 0, missing: 0, versions: 0, duplicates: 0, failures: 0, unavailable: 0 },
  areas: [], latestRun: null, recentChanges: [],
};
export const slackPreview: Awaited<ReturnType<typeof getSlackDashboard>> = {
  workspaces: [], channels: [], counts: { users: 0, messages: 0, threads: 0, files: 0, links: 0, edits: 0 },
  latestRun: null, failures: [],
};
export const meetingPreview: Awaited<ReturnType<typeof getMeetingDashboard>> = {
  counts: { meetings: 0, thisMonth: 0, transcripts: 0, summaries: 0, notes: 0, changedArtifacts: 0, errors: 0 },
  latestMeeting: null, latestRun: null,
};
export const operationsPreview: Awaited<ReturnType<typeof getOperationsDashboard>> = {
  counts: { needsReview: 0, openActions: 0, overdue: 0, blocked: 0, decisions: 0, questions: 0, commitments: 0, updates: 0 },
  recent: [], latestEvents: [],
};
