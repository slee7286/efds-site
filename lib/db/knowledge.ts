import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import type { KnowledgeArticle, KnowledgeRequirement, KnowledgeSummary } from "@/types/domain";

const demoArticles: KnowledgeArticle[] = [
  { id: "demo-events", externalId: "101000590031", title: "Planning an event with ICU", url: null, category: "Events & Trips", folder: "Committee Member Resources", markdown: "Start planning early and complete the relevant risk assessment before booking suppliers.", sourceUpdatedAt: "2026-08-07T12:00:00Z", relevance: "high", reviewStatus: "approved", isStale: false },
  { id: "demo-finance", externalId: "101000590042", title: "Finance and funding essentials", url: null, category: "Finances", folder: "Committee Member Resources", markdown: "Use the society finance process for purchases, reimbursements and funding applications.", sourceUpdatedAt: "2026-08-05T12:00:00Z", relevance: "critical", reviewStatus: "proposed", isStale: false },
  { id: "demo-room", externalId: "101000590031", title: "Booking a room for your society", url: null, category: "Room bookings", folder: "Committee Member Resources", markdown: "Submit room requests with enough notice for the activity and include accessibility needs.", sourceUpdatedAt: "2026-07-30T12:00:00Z", relevance: "high", reviewStatus: "approved", isStale: false },
];

export async function listKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  if (!isSupabaseConfigured) return demoArticles;
  await requireRole("committee");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("knowledge_articles").select("id, external_id, title, url, category, folder, markdown, source_updated_at, efds_relevance, relevance_review_status, metadata").eq("source_type", "icu_freshdesk").order("title");
  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, externalId: row.external_id, title: row.title, url: row.url, category: row.category, folder: row.folder, markdown: row.markdown, sourceUpdatedAt: row.source_updated_at, relevance: row.efds_relevance, reviewStatus: row.relevance_review_status, isStale: Boolean((row.metadata as Record<string, unknown> | null)?.stale) }));
}

export async function getKnowledgeArticle(id: string) {
  const articles = await listKnowledgeArticles();
  return articles.find((article) => article.id === id) ?? null;
}

export async function getKnowledgeSummary(): Promise<KnowledgeSummary> {
  if (isSupabaseConfigured) {
    const profile = await getCurrentProfile();
    if (!profile || !hasMinimumRole(profile.accessRole, "committee")) {
      return { articleCount: 0, highRelevanceCount: 0, proposedCount: 0, staleCount: 0, lastSyncedAt: null };
    }
  }
  const articles = await listKnowledgeArticles();
  return {
    articleCount: articles.length || 78,
    highRelevanceCount: articles.filter((article) => ["critical", "high"].includes(article.relevance)).length || 54,
    proposedCount: articles.filter((article) => article.reviewStatus === "proposed").length || 32,
    staleCount: articles.filter((article) => article.isStale).length,
    lastSyncedAt: articles.length ? articles[0].sourceUpdatedAt : null,
  };
}

export async function listRequirements(): Promise<KnowledgeRequirement[]> {
  if (!isSupabaseConfigured) return [
    { id: "req-1", text: "Complete a risk assessment before submitting a higher-risk event.", type: "obligation", appliesTo: "Event organisers", mandatory: true, reviewStatus: "proposed", sourceArticleId: "demo-events" },
    { id: "req-2", text: "Keep receipts and supporting evidence for finance claims.", type: "obligation", appliesTo: "Treasurer and claimants", mandatory: true, reviewStatus: "approved", sourceArticleId: "demo-finance" },
    { id: "req-3", text: "Submit room booking requests with sufficient notice.", type: "timing", appliesTo: "Committee members", mandatory: true, reviewStatus: "approved", sourceArticleId: "demo-room" },
  ];
  await requireRole("committee");
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("knowledge_requirements").select("id, requirement_text, requirement_type, applies_to, mandatory, review_status, source_article_id").eq("is_stale", false).order("created_at", { ascending: false });
  return (data ?? []).map((row) => ({ id: row.id, text: row.requirement_text, type: row.requirement_type, appliesTo: row.applies_to, mandatory: row.mandatory, reviewStatus: row.review_status, sourceArticleId: row.source_article_id }));
}
