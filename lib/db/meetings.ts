import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { MeetingArchiveItem, MeetingArtifact, MeetingSourceChange, MeetingTranscriptSegment } from "@/types/domain";

type Row = Record<string, any>;

const MEETING_SOURCES = ["meetily", "google_docs_meetings"];

const MEETING_FIELDS = "id, title, external_meeting_id, meeting_type, started_at, ended_at, duration_seconds, source_type, status, source_created_at, source_updated_at, first_seen_at, last_seen_at, last_changed_at, is_missing";

function text(value: unknown, fallback = ""): string { return typeof value === "string" ? value : fallback; }
function nullable(value: unknown): string | null { return typeof value === "string" && value ? value : null; }
function number(value: unknown): number | null { return typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : null; }
function bool(value: unknown): boolean { return value === true || value === "true"; }

async function requireMeetingAdmin() { await requireRole("admin"); }

function itemFromRow(row: Row, transcriptAvailable = false, summaryAvailable = false, notesAvailable = false): MeetingArchiveItem {
  return {
    id: text(row.id), title: text(row.title, "Untitled meeting"), externalMeetingId: nullable(row.external_meeting_id),
    meetingType: nullable(row.meeting_type), startedAt: nullable(row.started_at), endedAt: nullable(row.ended_at),
    durationSeconds: number(row.duration_seconds), sourceType: text(row.source_type, "manual"), status: text(row.status, "active"),
    sourceCreatedAt: nullable(row.source_created_at), sourceUpdatedAt: nullable(row.source_updated_at), firstSeenAt: nullable(row.first_seen_at),
    lastSeenAt: nullable(row.last_seen_at), lastChangedAt: nullable(row.last_changed_at), isMissing: bool(row.is_missing),
    transcriptAvailable, summaryAvailable, notesAvailable,
  };
}

function artifactFromRow(row: Row): MeetingArtifact {
  return {
    id: text(row.id), artifactType: text(row.artifact_type), sourceRecordId: nullable(row.source_record_id), sourceReference: nullable(row.source_reference),
    content: text(row.content), contentHash: text(row.content_hash), format: nullable(row.format), sourceCreatedAt: nullable(row.source_created_at),
    sourceUpdatedAt: nullable(row.source_updated_at), ingestedAt: nullable(row.ingested_at), isCurrent: bool(row.is_current), generatedBy: nullable(row.generated_by),
    reviewStatus: text(row.review_status, "source_generated"), summaryTemplate: nullable(row.summary_template),
  };
}

function segmentFromRow(row: Row): MeetingTranscriptSegment {
  return { id: text(row.id), artifactId: text(row.artifact_id), sequence: number(row.sequence) ?? 0, startMs: number(row.start_ms), endMs: number(row.end_ms), speaker: nullable(row.speaker), text: text(row.text) };
}

function changeFromRow(row: Row): MeetingSourceChange {
  return { id: text(row.id), changeType: text(row.change_type), previousHash: nullable(row.previous_hash), newHash: nullable(row.new_hash), previousValue: nullable(row.previous_value), newValue: nullable(row.new_value), detectedAt: nullable(row.detected_at) };
}

async function exactCount(supabase: any, table: string, filters: ((query: any) => any)[] = []) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const filter of filters) query = filter(query);
  const result = await query;
  if (result.error) throw result.error;
  return result.count ?? 0;
}

export async function getMeetingDashboard() {
  await requireMeetingAdmin();
  const empty = { counts: { meetings: 0, thisMonth: 0, transcripts: 0, summaries: 0, notes: 0, changedArtifacts: 0, errors: 0 }, latestMeeting: null as MeetingArchiveItem | null, latestRun: null as Row | null };
  if (!isSupabaseConfigured) return empty;
  const supabase = await createServerSupabaseClient();
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const [meetings, thisMonth, transcripts, summaries, changes, latestMeeting, latestRun, failures, notes] = await Promise.all([
    exactCount(supabase, "meetings", [(query) => query.in("source_type", MEETING_SOURCES)]),
    exactCount(supabase, "meetings", [(query) => query.in("source_type", MEETING_SOURCES).gte("started_at", monthStart.toISOString())]),
    exactCount(supabase, "meeting_artifacts", [(query) => query.eq("artifact_type", "transcript").eq("is_current", true)]),
    exactCount(supabase, "meeting_artifacts", [(query) => query.eq("artifact_type", "summary").eq("is_current", true)]),
    exactCount(supabase, "meeting_source_changes", [(query) => query.gte("detected_at", monthStart.toISOString())]),
    supabase.from("meetings").select(MEETING_FIELDS).in("source_type", MEETING_SOURCES).order("first_seen_at", { ascending: false }).limit(1),
    supabase.from("ingestion_runs").select("id, status, started_at, finished_at, records_seen, records_created, records_updated, records_skipped, records_failed, metadata, error_log").in("source_type", MEETING_SOURCES).order("started_at", { ascending: false }).limit(1),
    exactCount(supabase, "ingestion_runs", [(query) => query.in("source_type", MEETING_SOURCES).in("status", ["failed", "completed_with_errors"])]),
    exactCount(supabase, "meeting_artifacts", [(query) => query.eq("artifact_type", "notes").eq("is_current", true)]),
  ]);
  if (latestMeeting.error) throw latestMeeting.error;
  if (latestRun.error) throw latestRun.error;
  const latest = latestMeeting.data?.[0] ? itemFromRow(latestMeeting.data[0]) : null;
  return { counts: { meetings, thisMonth, transcripts, summaries, notes, changedArtifacts: changes, errors: failures }, latestMeeting: latest, latestRun: latestRun.data?.[0] ?? null };
}

export async function listMeetings(options: { query?: string; from?: string; to?: string; hasTranscript?: boolean; hasSummary?: boolean } = {}) {
  await requireMeetingAdmin();
  if (!isSupabaseConfigured) return [] as MeetingArchiveItem[];
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("meetings").select(MEETING_FIELDS).in("source_type", MEETING_SOURCES).order("first_seen_at", { ascending: false }).limit(500);
  if (result.error) throw result.error;
  const rows = (result.data ?? []) as Row[];
  const ids = rows.map((row) => text(row.id));
  const artifacts = ids.length ? await supabase.from("meeting_artifacts").select("meeting_id, artifact_type, is_current").in("meeting_id", ids).eq("is_current", true) : { data: [], error: null };
  if (artifacts.error) throw artifacts.error;
  const coverage = new Map<string, { transcript: boolean; summary: boolean; notes: boolean }>();
  for (const row of (artifacts.data ?? []) as Row[]) { const item = coverage.get(text(row.meeting_id)) ?? { transcript: false, summary: false, notes: false }; if (row.artifact_type === "transcript") item.transcript = true; if (row.artifact_type === "summary") item.summary = true; if (row.artifact_type === "notes") item.notes = true; coverage.set(text(row.meeting_id), item); }
  const normalizedQuery = options.query?.trim().toLowerCase();
  return rows.map((row) => { const flags = coverage.get(text(row.id)) ?? { transcript: false, summary: false, notes: false }; return itemFromRow(row, flags.transcript, flags.summary, flags.notes); }).filter((item) => {
    if (options.from && (item.startedAt ?? "") < options.from) return false;
    if (options.to && (item.startedAt ?? "") > `${options.to}T23:59:59.999Z`) return false;
    if (options.hasTranscript !== undefined && item.transcriptAvailable !== options.hasTranscript) return false;
    if (options.hasSummary !== undefined && item.summaryAvailable !== options.hasSummary) return false;
    return !normalizedQuery || `${item.title} ${item.externalMeetingId ?? ""} ${item.meetingType ?? ""}`.toLowerCase().includes(normalizedQuery);
  });
}

export async function getMeeting(id: string) {
  await requireMeetingAdmin();
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const meeting = await supabase.from("meetings").select(`${MEETING_FIELDS}, metadata`).eq("id", id).in("source_type", MEETING_SOURCES).maybeSingle();
  if (meeting.error) throw meeting.error;
  if (!meeting.data) return null;
  const [artifacts, changes] = await Promise.all([
    supabase.from("meeting_artifacts").select("id, meeting_id, artifact_type, source_record_id, source_reference, content, content_hash, format, source_created_at, source_updated_at, ingested_at, is_current, generated_by, review_status, summary_template").eq("meeting_id", id).order("ingested_at", { ascending: false }),
    supabase.from("meeting_source_changes").select("id, change_type, previous_hash, new_hash, previous_value, new_value, detected_at").eq("meeting_id", id).order("detected_at", { ascending: false }),
  ]);
  if (artifacts.error) throw artifacts.error;
  if (changes.error) throw changes.error;
  const artifactRows = (artifacts.data ?? []) as Row[];
  const currentTranscript = artifactRows.find((row) => row.artifact_type === "transcript" && bool(row.is_current));
  const segments = currentTranscript ? await supabase.from("meeting_transcript_segments").select("id, artifact_id, sequence, start_ms, end_ms, speaker, text").eq("artifact_id", currentTranscript.id).order("sequence") : { data: [], error: null };
  if (segments.error) throw segments.error;
  return { meeting: itemFromRow(meeting.data, Boolean(currentTranscript), artifactRows.some((row) => row.artifact_type === "summary" && bool(row.is_current)), artifactRows.some((row) => row.artifact_type === "notes" && bool(row.is_current))), metadata: (meeting.data.metadata && typeof meeting.data.metadata === "object" ? meeting.data.metadata : {}) as Record<string, unknown>, artifacts: artifactRows.map(artifactFromRow), segments: ((segments.data ?? []) as Row[]).map(segmentFromRow), changes: ((changes.data ?? []) as Row[]).map(changeFromRow) };
}
