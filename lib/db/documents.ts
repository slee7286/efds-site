import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DocumentArchiveChange, DocumentArchiveItem, DocumentArchiveVersion } from "@/types/domain";

type Row = Record<string, any>;

function text(value: unknown, fallback = ""): string { return typeof value === "string" ? value : fallback; }
function nullable(value: unknown): string | null { return typeof value === "string" && value ? value : null; }
function number(value: unknown): number | null { return typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : null; }
function bool(value: unknown): boolean { return value === true || value === "true"; }

async function requireDocumentAdmin() { await requireRole("admin"); }

function itemFromRow(row: Row, duplicateCount = 0): DocumentArchiveItem {
  const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Row : {};
  return {
    id: text(row.id), title: text(row.title, "Untitled document"), documentType: nullable(row.document_type), sourceType: nullable(row.source_type), sourceRoot: nullable(row.source_root), relativePath: nullable(row.relative_path), sourceArea: nullable(row.source_area), mimeType: nullable(row.mime_type), extension: nullable(metadata.extension), fileSizeBytes: number(row.file_size_bytes), contentHash: nullable(row.content_hash), extractionStatus: nullable(row.extraction_status), extractionError: nullable(row.extraction_error), isMissing: bool(row.is_missing), isUnavailable: bool(row.is_unavailable), firstSeenAt: nullable(row.first_seen_at), lastSeenAt: nullable(row.last_seen_at), lastSyncedAt: nullable(row.last_synced_at), lastChangedAt: nullable(row.last_changed_at), filesystemModifiedAt: nullable(row.filesystem_modified_at), duplicateCount,
  };
}

function versionFromRow(row: Row): DocumentArchiveVersion {
  return { id: text(row.id), contentHash: text(row.content_hash), rawText: nullable(row.raw_text), extractionStatus: text(row.extraction_status), extractionError: nullable(row.extraction_error), mimeType: nullable(row.mime_type), sourceModifiedAt: nullable(row.source_modified_at), fileSizeBytes: number(row.file_size_bytes), ingestedAt: nullable(row.ingested_at) };
}

function changeFromRow(row: Row): DocumentArchiveChange {
  return { id: text(row.id), changeType: text(row.change_type), previousPath: nullable(row.previous_path), newPath: nullable(row.new_path), previousContentHash: nullable(row.previous_content_hash), newContentHash: nullable(row.new_content_hash), detectedAt: nullable(row.detected_at) };
}

async function duplicateCounts(supabase: any, rows: Row[]) {
  const hashes = [...new Set(rows.map((row) => text(row.content_hash)).filter(Boolean))];
  if (!hashes.length) return new Map<string, number>();
  const result = await supabase.from("documents").select("content_hash").in("content_hash", hashes);
  if (result.error) throw result.error;
  const counts = new Map<string, number>();
  for (const row of result.data ?? []) counts.set(text(row.content_hash), (counts.get(text(row.content_hash)) ?? 0) + 1);
  return counts;
}

export async function getDocumentDashboard() {
  await requireDocumentAdmin();
  if (!isSupabaseConfigured) return { counts: { files: 0, current: 0, missing: 0, versions: 0, duplicates: 0, failures: 0, unavailable: 0 }, areas: [], latestRun: null, recentChanges: [] as DocumentArchiveChange[] };
  const supabase = await createServerSupabaseClient();
  const [documents, versions, runs, changes] = await Promise.all([
    supabase.from("documents").select("id, source_area, content_hash, is_missing, is_unavailable, extraction_status, metadata").eq("source_type", "onedrive_filesystem"),
    supabase.from("document_versions").select("id", { count: "exact", head: true }),
    supabase.from("ingestion_runs").select("id, status, started_at, finished_at, records_seen, records_created, records_updated, records_skipped, records_failed, metadata, error_log").eq("source_type", "onedrive_filesystem").order("started_at", { ascending: false }).limit(1),
    supabase.from("document_source_changes").select("id, change_type, previous_path, new_path, previous_content_hash, new_content_hash, detected_at").order("detected_at", { ascending: false }).limit(10),
  ]);
  if (documents.error) throw documents.error;
  if (versions.error) throw versions.error;
  if (runs.error) throw runs.error;
  if (changes.error) throw changes.error;
  const rows = (documents.data ?? []) as Row[];
  const hashCounts = new Map<string, number>();
  for (const row of rows) if (text(row.content_hash)) hashCounts.set(text(row.content_hash), (hashCounts.get(text(row.content_hash)) ?? 0) + 1);
  const areas = [...new Set(rows.map((row) => nullable(row.source_area)).filter((value): value is string => Boolean(value)))].sort();
  return { counts: { files: rows.length, current: rows.filter((row) => !bool(row.is_missing)).length, missing: rows.filter((row) => bool(row.is_missing)).length, versions: versions.count ?? 0, duplicates: [...hashCounts.values()].filter((count) => count > 1).length, failures: rows.filter((row) => ["failed", "error"].includes(text(row.extraction_status))).length, unavailable: rows.filter((row) => bool(row.is_unavailable) || text(row.extraction_status) === "unavailable").length }, areas, latestRun: runs.data?.[0] ?? null, recentChanges: (changes.data ?? []).map((row: Row) => changeFromRow(row)) };
}

export async function listDocuments(options: { query?: string; area?: string; status?: string; extraction?: string; extension?: string; from?: string; to?: string; duplicate?: boolean } = {}) {
  await requireDocumentAdmin();
  if (!isSupabaseConfigured) return [] as DocumentArchiveItem[];
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("documents").select("*").eq("source_type", "onedrive_filesystem").order("relative_path");
  if (options.area) query = query.eq("source_area", options.area);
  if (options.status === "missing") query = query.eq("is_missing", true);
  if (options.status === "current") query = query.eq("is_missing", false);
  if (options.status === "unavailable") query = query.eq("is_unavailable", true);
  if (options.extraction) query = query.eq("extraction_status", options.extraction);
  if (options.extension) query = query.ilike("relative_path", `%${options.extension.startsWith(".") ? options.extension : `.${options.extension}`}`);
  if (options.from) query = query.gte("filesystem_modified_at", options.from);
  if (options.to) query = query.lte("filesystem_modified_at", options.to);
  const result = await query;
  if (result.error) throw result.error;
  const rows = (result.data ?? []) as Row[];
  const counts = await duplicateCounts(supabase, rows);
  const normalizedQuery = options.query?.trim().toLowerCase();
  return rows.map((row) => itemFromRow(row, counts.get(text(row.content_hash)) ?? 0)).filter((item, index) => {
    if (options.duplicate && item.duplicateCount <= 1) return false;
    if (!normalizedQuery) return true;
    const row = rows[index];
    return [item.title, item.relativePath, text(row.raw_text), item.sourceArea, item.mimeType].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery);
  }).slice(0, 500);
}

export async function getDocument(id: string) {
  await requireDocumentAdmin();
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("documents").select("*").eq("id", id).eq("source_type", "onedrive_filesystem").maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;
  const [versions, changes, duplicates] = await Promise.all([
    supabase.from("document_versions").select("id, content_hash, raw_text, extraction_status, extraction_error, mime_type, source_modified_at, file_size_bytes, ingested_at").eq("document_id", id).order("ingested_at", { ascending: false }),
    supabase.from("document_source_changes").select("id, change_type, previous_path, new_path, previous_content_hash, new_content_hash, detected_at").eq("document_id", id).order("detected_at", { ascending: false }),
    supabase.from("documents").select("*").eq("content_hash", result.data.content_hash).neq("id", id).order("relative_path"),
  ]);
  if (versions.error) throw versions.error;
  if (changes.error) throw changes.error;
  if (duplicates.error) throw duplicates.error;
  return { document: itemFromRow(result.data, 1 + (duplicates.data?.length ?? 0)), rawText: nullable(result.data.raw_text), versions: (versions.data ?? []).map((row: Row) => versionFromRow(row)), changes: (changes.data ?? []).map((row: Row) => changeFromRow(row)), duplicates: (duplicates.data ?? []).map((row: Row) => itemFromRow(row)) };
}
