import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { requireAuthenticatedProfile, requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RetrievalSourceType, UnifiedRetrievalResult } from "@/types/domain";

export interface RetrievalSearchInput {
  query: string; sourceTypes?: RetrievalSourceType[]; sourceArea?: string; topic?: string; channel?: string;
  author?: string; from?: string; to?: string; includeHistory?: boolean; limit?: number; offset?: number;
  scope: "member" | "admin";
}

const demos: UnifiedRetrievalResult[] = [{ retrievalUnitId: "demo-retrieval-1", sourceType: "knowledge_requirement", sourceRecordId: "demo-req", sourceParentId: "demo-article", sourceVersionId: null, title: "External speaker approval", snippet: "Complete the external speaker approval process before confirming the invitation.", score: 1, sourceArea: "events", topic: "events", channel: null, author: null, occurredAt: null, sourceUpdatedAt: "2026-08-01T12:00:00Z", reviewStatus: "approved", visibility: "member", isCurrent: true, isStale: false, sourceUrl: null, permalink: null, relativePath: null, contentHash: null, metadata: {} }];

function mapResult(row: Record<string, unknown>): UnifiedRetrievalResult {
  return { retrievalUnitId: String(row.retrieval_unit_id ?? row.id), sourceType: row.source_type as RetrievalSourceType, sourceRecordId: String(row.source_record_id), sourceParentId: (row.source_parent_id as string | null) ?? null, sourceVersionId: (row.source_version_id as string | null) ?? null, title: String(row.title), snippet: String(row.snippet ?? ""), score: Number(row.score ?? 0), sourceArea: (row.source_area as string | null) ?? null, topic: (row.topic as string | null) ?? null, channel: (row.channel as string | null) ?? null, author: (row.author as string | null) ?? null, occurredAt: (row.occurred_at as string | null) ?? null, sourceUpdatedAt: (row.source_updated_at as string | null) ?? null, reviewStatus: (row.review_status as string | null) ?? null, visibility: (row.visibility as UnifiedRetrievalResult["visibility"]) ?? null, isCurrent: Boolean(row.is_current), isStale: Boolean(row.is_stale), sourceUrl: (row.source_url as string | null) ?? null, permalink: (row.permalink as string | null) ?? null, relativePath: (row.relative_path as string | null) ?? null, contentHash: (row.content_hash as string | null) ?? null, metadata: (row.metadata as Record<string, unknown>) ?? {}, authority: (row.authority as string | null) ?? null, lexicalRank: row.lexical_rank == null ? null : Number(row.lexical_rank), semanticRank: row.semantic_rank == null ? null : Number(row.semantic_rank), semanticSimilarity: row.semantic_similarity == null ? null : Number(row.semantic_similarity), hybridScore: row.hybrid_score == null ? null : Number(row.hybrid_score), scoreComponents: (row.score_components as Record<string, number>) ?? {} };
}

export async function searchRetrieval(input: RetrievalSearchInput): Promise<UnifiedRetrievalResult[]> {
  const query = input.query.trim();
  if (!query) return [];
  if (!isSupabaseConfigured) return demos;
  if (input.scope === "admin") await requireRole("admin"); else await requireAuthenticatedProfile();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("search_retrieval_units", { search_query: query, requested_source_types: input.sourceTypes?.length ? input.sourceTypes : null, requested_area: input.sourceArea || null, requested_topic: input.topic || null, requested_channel: input.channel || null, requested_author: input.author || null, requested_from: input.from || null, requested_to: input.to || null, include_history: Boolean(input.includeHistory && input.scope === "admin"), result_limit: Math.min(Math.max(input.limit ?? 20, 1), 50), result_offset: Math.max(input.offset ?? 0, 0) });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(mapResult);
}

export async function getEmbeddingHealth() {
  if (!isSupabaseConfigured) return null;
  await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const [units, embeddings, latest] = await Promise.all([
    supabase.from("retrieval_units").select("id", { count: "exact", head: true }),
    supabase.from("retrieval_embeddings").select("retrieval_unit_id", { count: "exact", head: true }),
    supabase.from("retrieval_embeddings").select("provider, model, model_version, updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (units.error || embeddings.error || latest.error) return null;
  return { retrievalUnits: units.count ?? 0, embeddings: embeddings.count ?? 0, missing: Math.max((units.count ?? 0) - (embeddings.count ?? 0), 0), latest: latest.data ?? null };
}
