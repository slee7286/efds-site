import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OperationalEvidence, OperationalRecord, OperationalRecordType, OperationalReviewEvent } from "@/types/domain";

type Row = Record<string, any>;

const FIELDS = "id, record_type, title, description, priority, owner_profile_id, owner_officer_id, owner_text, due_at, due_text, occurred_at, workstream, execution_status, review_status, visibility, is_current, review_version, created_at, updated_at, reviewed_at, completed_at, resolved_at, superseded_by_id";

function text(value: unknown, fallback = ""): string { return typeof value === "string" ? value : fallback; }
function nullable(value: unknown): string | null { return typeof value === "string" && value ? value : null; }
function number(value: unknown): number { return typeof value === "number" ? value : Number(value ?? 0); }
function bool(value: unknown): boolean { return value === true || value === "true"; }

async function admin() { await requireRole("admin"); }

function recordFromRow(row: Row): OperationalRecord {
  return { id: text(row.id), recordType: text(row.record_type) as OperationalRecordType, title: text(row.title), description: nullable(row.description), priority: nullable(row.priority), ownerProfileId: nullable(row.owner_profile_id), ownerOfficerId: nullable(row.owner_officer_id), ownerText: nullable(row.owner_text), dueAt: nullable(row.due_at), dueText: nullable(row.due_text), occurredAt: nullable(row.occurred_at), workstream: nullable(row.workstream), executionStatus: nullable(row.execution_status) as OperationalRecord["executionStatus"], reviewStatus: text(row.review_status, "proposed") as OperationalRecord["reviewStatus"], visibility: text(row.visibility, "internal") as OperationalRecord["visibility"], isCurrent: bool(row.is_current), reviewVersion: number(row.review_version), createdAt: nullable(row.created_at), updatedAt: nullable(row.updated_at), reviewedAt: nullable(row.reviewed_at), completedAt: nullable(row.completed_at), resolvedAt: nullable(row.resolved_at), supersededById: nullable(row.superseded_by_id) };
}

function evidenceFromRow(row: Row, source?: Row): OperationalEvidence {
  return { id: text(row.id), retrievalUnitId: text(row.retrieval_unit_id), sourceType: text(row.source_type), sourceRecordId: text(row.source_record_id), sourceVersionId: nullable(row.source_version_id), title: source ? nullable(source.title) : nullable(row.metadata?.title), evidenceText: nullable(row.evidence_text), evidenceRole: text(row.evidence_role, "supporting"), createdAt: nullable(row.created_at) };
}

function eventFromRow(row: Row): OperationalReviewEvent {
  return { id: text(row.id), action: text(row.action), previousReviewStatus: nullable(row.previous_review_status), newReviewStatus: nullable(row.new_review_status), reviewerProfileId: text(row.reviewer_profile_id), reason: nullable(row.reason), changes: (row.changes && typeof row.changes === "object" ? row.changes : {}) as Record<string, unknown>, createdAt: nullable(row.created_at) };
}

async function count(supabase: any, filters: ((query: any) => any)[] = []) {
  let query = supabase.from("operational_records").select("id", { count: "exact", head: true });
  for (const filter of filters) query = filter(query);
  const result = await query;
  if (result.error) throw result.error;
  return result.count ?? 0;
}

export async function getOperationsDashboard() {
  await admin();
  const empty = { counts: { needsReview: 0, openActions: 0, overdue: 0, blocked: 0, decisions: 0, questions: 0, commitments: 0, updates: 0 }, recent: [] as OperationalRecord[], latestEvents: [] as OperationalReviewEvent[] };
  if (!isSupabaseConfigured) return empty;
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const [needsReview, openActions, overdue, blocked, decisions, questions, commitments, updates, recent, events] = await Promise.all([
    count(supabase, [(q) => q.in("review_status", ["proposed", "needs_review"])]),
    count(supabase, [(q) => q.eq("record_type", "action_item").eq("review_status", "approved").in("execution_status", ["open", "in_progress", "blocked"])]),
    count(supabase, [(q) => q.eq("record_type", "action_item").eq("review_status", "approved").lt("due_at", now).in("execution_status", ["open", "in_progress", "blocked"])]),
    count(supabase, [(q) => q.eq("execution_status", "blocked")]),
    count(supabase, [(q) => q.eq("record_type", "decision")]), count(supabase, [(q) => q.eq("record_type", "open_question").in("execution_status", ["open", "answered"])]),
    count(supabase, [(q) => q.eq("record_type", "commitment")]), count(supabase, [(q) => q.eq("record_type", "status_update")]),
    supabase.from("operational_records").select(FIELDS).order("updated_at", { ascending: false }).limit(12),
    supabase.from("operational_review_events").select("id, action, previous_review_status, new_review_status, reviewer_profile_id, reason, changes, created_at").order("created_at", { ascending: false }).limit(12),
  ]);
  if (recent.error) throw recent.error; if (events.error) throw events.error;
  return { counts: { needsReview, openActions, overdue, blocked, decisions, questions, commitments, updates }, recent: (recent.data ?? []).map(recordFromRow), latestEvents: (events.data ?? []).map(eventFromRow) };
}

export async function listOperationalRecords(options: { type?: string; review?: string; execution?: string; workstream?: string; owner?: string; overdue?: boolean; query?: string } = {}) {
  await admin();
  if (!isSupabaseConfigured) return [] as OperationalRecord[];
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("operational_records").select(FIELDS).order("updated_at", { ascending: false }).limit(500);
  if (options.type) query = query.eq("record_type", options.type);
  if (options.review) query = query.eq("review_status", options.review);
  if (options.execution) query = query.eq("execution_status", options.execution);
  if (options.workstream) query = query.eq("workstream", options.workstream);
  if (options.owner) query = query.or(`owner_profile_id.eq.${options.owner},owner_officer_id.eq.${options.owner}`);
  if (options.overdue) query = query.lt("due_at", new Date().toISOString()).in("execution_status", ["open", "in_progress", "blocked"]);
  const result = await query;
  if (result.error) throw result.error;
  const records = (result.data ?? []).map(recordFromRow);
  const normalized = options.query?.trim().toLowerCase();
  return normalized ? records.filter((record) => `${record.title} ${record.description ?? ""} ${record.workstream ?? ""} ${record.ownerText ?? ""}`.toLowerCase().includes(normalized)) : records;
}

export async function getOperationalRecord(id: string) {
  await admin();
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const record = await supabase.from("operational_records").select(`${FIELDS}, metadata`).eq("id", id).maybeSingle();
  if (record.error) throw record.error; if (!record.data) return null;
  const [evidence, events] = await Promise.all([
    supabase.from("operational_record_evidence").select("id, retrieval_unit_id, source_type, source_record_id, source_version_id, evidence_text, evidence_role, created_at, metadata").eq("operational_record_id", id).order("created_at", { ascending: true }),
    supabase.from("operational_review_events").select("id, action, previous_review_status, new_review_status, reviewer_profile_id, reason, changes, created_at").eq("operational_record_id", id).order("created_at", { ascending: false }),
  ]);
  if (evidence.error) throw evidence.error; if (events.error) throw events.error;
  const evidenceRows = (evidence.data ?? []) as Row[];
  const unitIds = evidenceRows.map((row) => text(row.retrieval_unit_id));
  const units = unitIds.length ? await supabase.from("retrieval_units").select("id, title").in("id", unitIds) : { data: [], error: null };
  if (units.error) throw units.error;
  const unitMap = new Map((units.data ?? []).map((row: Row) => [text(row.id), row]));
  return { record: recordFromRow(record.data), metadata: (record.data.metadata && typeof record.data.metadata === "object" ? record.data.metadata : {}) as Record<string, unknown>, evidence: evidenceRows.map((row) => evidenceFromRow(row, unitMap.get(text(row.retrieval_unit_id)))), events: (events.data ?? []).map(eventFromRow) };
}

export async function getOperationalWorkstreams() {
  await admin();
  if (!isSupabaseConfigured) return [] as string[];
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("operational_records").select("workstream").not("workstream", "is", null).order("workstream");
  if (result.error) throw result.error;
  return [...new Set((result.data ?? []).map((row: Row) => text(row.workstream)).filter(Boolean))];
}
