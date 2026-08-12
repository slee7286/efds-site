import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { requireRole } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  KnowledgeArticle,
  KnowledgeReviewEvent,
  KnowledgeReviewItem,
  KnowledgeSource,
  KnowledgeType,
  KnowledgeVisibility,
  ReviewStatus,
} from "@/types/domain";

type DbRow = Record<string, unknown>;
type FilterValue = string | undefined;

const derivedTables: Record<KnowledgeType, string> = {
  requirement: "knowledge_requirements",
  timing_rule: "knowledge_timing_rules",
  process: "knowledge_processes",
  process_step: "knowledge_process_steps",
  resource: "knowledge_resources",
  contact: "knowledge_contacts",
};

const typeLabels: Record<KnowledgeType, string> = {
  requirement: "Requirement",
  timing_rule: "Timing rule",
  process: "Process",
  process_step: "Process step",
  resource: "Resource",
  contact: "Contact",
};

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" ? value : typeof value === "string" ? Number(value) : null;
}

function booleanValue(value: unknown) {
  return value === true || value === "true";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isMissingArticle(row: DbRow) {
  const metadata = objectValue(row.metadata);
  return metadata.stale === true || metadata.lifecycle === "missing" || metadata.source_status === "missing";
}

function articleFromRow(row: DbRow): KnowledgeArticle {
  return {
    id: stringValue(row.id),
    externalId: nullableString(row.external_id),
    title: stringValue(row.title, "Untitled ICU article"),
    url: nullableString(row.url),
    category: nullableString(row.category),
    folder: nullableString(row.folder),
    markdown: nullableString(row.markdown),
    sourceUpdatedAt: nullableString(row.source_updated_at),
    relevance: (stringValue(row.efds_relevance, "low") as KnowledgeArticle["relevance"]),
    reviewStatus: (stringValue(row.relevance_review_status, "proposed") as KnowledgeArticle["reviewStatus"]),
    isStale: isMissingArticle(row),
    sourceType: stringValue(row.source_type),
    contentHash: nullableString(row.content_hash),
    rawHtml: nullableString(row.raw_html),
    firstSeenAt: nullableString(row.first_seen_at),
    lastCheckedAt: nullableString(row.last_checked_at),
    lastChangedAt: nullableString(row.last_changed_at),
    crawledAt: nullableString(row.crawled_at),
    relevanceConfidence: numberValue(row.relevance_confidence),
    relevanceMethod: nullableString(row.relevance_method),
    relevanceEvidence: nullableString(row.relevance_evidence),
    extractionHash: nullableString(row.last_extracted_content_hash),
    extractedAt: nullableString(row.last_extracted_at),
    extractionRunId: nullableString(row.last_extraction_run_id),
  };
}

async function requireOperationalRole(role: "member" | "committee" | "admin") {
  if (!isSupabaseConfigured) return null;
  return requireRole(role);
}

async function fetchArticles(includeMarkdown = false) {
  if (!isSupabaseConfigured) return [] as KnowledgeArticle[];
  const supabase = await createServerSupabaseClient();
  const fields = includeMarkdown
    ? "id, source_type, external_id, title, url, category, folder, raw_html, markdown, content_hash, source_updated_at, crawled_at, first_seen_at, last_checked_at, last_changed_at, efds_relevance, relevance_confidence, relevance_method, relevance_review_status, relevance_evidence, relevance_updated_at, last_extracted_content_hash, last_extracted_at, last_extraction_run_id, metadata"
    : "id, source_type, external_id, title, url, category, folder, content_hash, source_updated_at, crawled_at, first_seen_at, last_checked_at, last_changed_at, efds_relevance, relevance_confidence, relevance_method, relevance_review_status, relevance_evidence, last_extracted_content_hash, last_extracted_at, last_extraction_run_id, metadata";
  const queryClient = supabase as unknown as { from: (table: string) => { select: (columns: string) => any } };
  const { data, error } = await queryClient.from("knowledge_articles").select(fields).eq("source_type", "icu_freshdesk").order("title");
  if (error) throw error;
  const rows = (data ?? []) as unknown as DbRow[];
  return rows.map((row: DbRow) => articleFromRow(row));
}

async function fetchRows(type: KnowledgeType) {
  if (!isSupabaseConfigured) return [] as DbRow[];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from(derivedTables[type]).select("*");
  if (error) throw error;
  return (data ?? []) as DbRow[];
}

async function fetchTaxonomy() {
  if (!isSupabaseConfigured) return { topics: new Map<string, string>(), roles: new Map<string, string>(), roleLinks: new Map<string, string[]>(), roleIdLinks: new Map<string, string[]>() };
  const supabase = await createServerSupabaseClient();
  const [topics, roles, requirementRoles, processRoles, articleRoles] = await Promise.all([
    supabase.from("knowledge_topics").select("id, label"),
    supabase.from("knowledge_roles").select("id, label"),
    supabase.from("knowledge_requirement_roles").select("requirement_id, role_id"),
    supabase.from("knowledge_process_roles").select("process_id, role_id"),
    supabase.from("knowledge_article_roles").select("knowledge_article_id, role_id"),
  ]);
  if (topics.error) throw topics.error;
  if (roles.error) throw roles.error;
  if (requirementRoles.error) throw requirementRoles.error;
  if (processRoles.error) throw processRoles.error;
  if (articleRoles.error) throw articleRoles.error;
  const topicMap = new Map((topics.data ?? []).map((row) => [String(row.id), String(row.label)]));
  const roleMap = new Map((roles.data ?? []).map((row) => [String(row.id), String(row.label)]));
  const roleLinks = new Map<string, string[]>();
  const roleIdLinks = new Map<string, string[]>();
  for (const row of [...(requirementRoles.data ?? []), ...(processRoles.data ?? []), ...(articleRoles.data ?? [])]) {
    const record = row as Record<string, unknown>;
    const recordId = String(record.requirement_id ?? record.process_id ?? record.knowledge_article_id);
    const roleId = String(record.role_id);
    const labels = roleLinks.get(recordId) ?? [];
    const ids = roleIdLinks.get(recordId) ?? [];
    const label = roleMap.get(roleId);
    if (label && !labels.includes(label)) labels.push(label);
    if (!ids.includes(roleId)) ids.push(roleId);
    roleLinks.set(recordId, labels);
    roleIdLinks.set(recordId, ids);
  }
  return { topics: topicMap, roles: roleMap, roleLinks, roleIdLinks };
}

function normalizedText(type: KnowledgeType, row: DbRow) {
  switch (type) {
    case "requirement": return stringValue(row.requirement_text);
    case "timing_rule": return stringValue(row.description);
    case "process": return stringValue(row.name);
    case "process_step": return stringValue(row.instruction);
    case "resource": return stringValue(row.name);
    case "contact": return stringValue(row.name || row.email || row.description, "Unnamed contact");
  }
}

function secondaryText(type: KnowledgeType, row: DbRow) {
  switch (type) {
    case "requirement": return nullableString(row.applies_to);
    case "timing_rule": return nullableString(row.deadline_type);
    case "process": return nullableString(row.description);
    case "process_step": return nullableString(row.condition);
    case "resource": return nullableString(row.url || row.description);
    case "contact": return nullableString(row.email || row.organisation || row.description);
  }
}

function toReviewItem(type: KnowledgeType, row: DbRow, articles: Map<string, KnowledgeArticle>, taxonomy: Awaited<ReturnType<typeof fetchTaxonomy>>): KnowledgeReviewItem {
  const articleId = stringValue(row.source_article_id);
  const article = articles.get(articleId);
  const source: KnowledgeSource = {
    articleId,
    title: article?.title ?? "Source article unavailable",
    url: nullableString(row.source_url) ?? article?.url ?? null,
    contentHash: nullableString(row.source_content_hash) ?? article?.contentHash ?? null,
    sourceUpdatedAt: nullableString(row.source_updated_at) ?? article?.sourceUpdatedAt ?? null,
    lastChangedAt: article?.lastChangedAt ?? null,
  };
  const roleLabels = taxonomy.roleLinks.get(stringValue(row.id)) ?? [];
  const roleIds = taxonomy.roleIdLinks.get(stringValue(row.id)) ?? [];
  return {
    id: stringValue(row.id),
    knowledgeType: type,
    normalizedText: normalizedText(type, row),
    secondaryText: secondaryText(type, row),
    source,
    evidenceText: stringValue(row.evidence_text),
    confidence: numberValue(row.confidence),
    extractionMethod: stringValue(row.extraction_method, "unknown"),
    extractedAt: nullableString(row.extracted_at),
    reviewStatus: stringValue(row.review_status, "proposed") as ReviewStatus,
    isStale: booleanValue(row.is_stale),
    visibility: stringValue(row.visibility, "internal") as KnowledgeVisibility,
    reviewedAt: nullableString(row.reviewed_at),
    reviewerName: null,
    topicLabel: taxonomy.topics.get(stringValue(row.topic_id)) ?? null,
    roleLabels,
    roleIds,
    reviewVersion: numberValue(row.review_version) ?? 1,
    metadata: objectValue(row.metadata),
    raw: row,
  };
}

async function fetchReviewItems(types: KnowledgeType[] = Object.keys(derivedTables) as KnowledgeType[], options: { includeTaxonomy?: boolean; includeSources?: boolean } = {}) {
  if (!isSupabaseConfigured) return [] as KnowledgeReviewItem[];
  const articles: KnowledgeArticle[] = options.includeSources === false ? [] : await fetchArticles(false);
  const taxonomy = options.includeTaxonomy === false
    ? { topics: new Map<string, string>(), roles: new Map<string, string>(), roleLinks: new Map<string, string[]>(), roleIdLinks: new Map<string, string[]>() }
    : await fetchTaxonomy();
  const rows: DbRow[][] = await Promise.all(types.map((type) => fetchRows(type)));
  const articleMap = new Map(articles.map((article) => [article.id, article]));
  return types.flatMap((type, index) => rows[index].map((row) => toReviewItem(type, row, articleMap, taxonomy)));
}

export interface ReviewFilters {
  type?: FilterValue;
  status?: FilterValue;
  stale?: FilterValue;
  topic?: FilterValue;
  role?: FilterValue;
  source?: FilterValue;
  method?: FilterValue;
  confidence?: FilterValue;
  q?: FilterValue;
  sort?: FilterValue;
  page?: number;
  pageSize?: number;
}

export async function listReviewQueue(filters: ReviewFilters = {}) {
  await requireOperationalRole("admin");
  let items = await fetchReviewItems(filters.type && filters.type in derivedTables ? [filters.type as KnowledgeType] : undefined);
  const query = filters.q?.trim().toLowerCase();
  if (filters.status) items = items.filter((item) => item.reviewStatus === filters.status);
  if (filters.stale === "stale") items = items.filter((item) => item.isStale);
  if (filters.stale === "current") items = items.filter((item) => !item.isStale);
  if (filters.topic) items = items.filter((item) => item.topicLabel === filters.topic || item.raw.topic_id === filters.topic);
  if (filters.role) items = items.filter((item) => item.roleLabels.includes(filters.role ?? ""));
  if (filters.source) items = items.filter((item) => item.source.articleId === filters.source);
  if (filters.method) items = items.filter((item) => item.extractionMethod === filters.method);
  if (filters.confidence === "low") items = items.filter((item) => item.confidence !== null && item.confidence < 0.6);
  if (filters.confidence === "medium") items = items.filter((item) => item.confidence !== null && item.confidence >= 0.6 && item.confidence < 0.85);
  if (filters.confidence === "high") items = items.filter((item) => item.confidence !== null && item.confidence >= 0.85);
  if (query) items = items.filter((item) => [item.normalizedText, item.secondaryText, item.evidenceText, item.source.title, item.topicLabel, ...item.roleLabels].filter(Boolean).join(" ").toLowerCase().includes(query));
  const sort = filters.sort ?? "priority";
  items.sort((left, right) => {
    if (sort === "stale") return Number(right.isStale) - Number(left.isStale) || right.source.sourceUpdatedAt?.localeCompare(left.source.sourceUpdatedAt ?? "") || 0;
    if (sort === "confidence") return (left.confidence ?? 1) - (right.confidence ?? 1);
    if (sort === "newest") return (right.extractedAt ?? "").localeCompare(left.extractedAt ?? "");
    if (sort === "source_changed") return (right.source.lastChangedAt ?? "").localeCompare(left.source.lastChangedAt ?? "");
    const priority = (item: KnowledgeReviewItem) => (item.isStale ? 0 : item.reviewStatus === "proposed" || item.reviewStatus === "needs_review" ? 1 : item.confidence !== null && item.confidence < 0.6 ? 2 : 3);
    return priority(left) - priority(right) || (left.confidence ?? 1) - (right.confidence ?? 1);
  });
  const pageSize = Math.min(Math.max(filters.pageSize ?? 50, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}

export async function getKnowledgeFilterOptions() {
  await requireOperationalRole("admin");
  const items = await fetchReviewItems();
  return {
    topics: [...new Set(items.map((item) => item.topicLabel).filter((value): value is string => Boolean(value)))].sort(),
    roles: [...new Set(items.flatMap((item) => item.roleLabels))].sort(),
    methods: [...new Set(items.map((item) => item.extractionMethod))].sort(),
    sources: [...new Map(items.map((item) => [item.source.articleId, item.source.title])).entries()].sort((left, right) => left[1].localeCompare(right[1])),
  };
}

export async function listKnowledgeRoles() {
  await requireOperationalRole("admin");
  if (!isSupabaseConfigured) return [] as { id: string; slug: string; label: string }[];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("knowledge_roles").select("id, slug, label").eq("active", true).order("label");
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: String(row.id), slug: String(row.slug), label: String(row.label) }));
}

export async function getKnowledgeTaxonomyOptions() {
  await requireOperationalRole("admin");
  if (!isSupabaseConfigured) return { topics: [] as { id: string; label: string }[], roles: [] as { id: string; label: string }[] };
  const supabase = await createServerSupabaseClient();
  const [topics, roles] = await Promise.all([
    supabase.from("knowledge_topics").select("id, label").order("label"),
    supabase.from("knowledge_roles").select("id, label").eq("active", true).order("label"),
  ]);
  if (topics.error) throw topics.error;
  if (roles.error) throw roles.error;
  return {
    topics: (topics.data ?? []).map((row) => ({ id: String(row.id), label: String(row.label) })),
    roles: (roles.data ?? []).map((row) => ({ id: String(row.id), label: String(row.label) })),
  };
}

export async function getRoleKnowledge(slug: string) {
  await requireOperationalRole("admin");
  const [roles, items, articles, taxonomy] = await Promise.all([listKnowledgeRoles(), fetchReviewItems(), fetchArticles(false), fetchTaxonomy()]);
  const role = roles.find((candidate) => candidate.slug === slug) ?? null;
  if (!role) return null;
  const articlesForRole = articles.filter((article) => (taxonomy.roleLinks.get(article.id) ?? []).some((label) => label === role.label)).map((article) => article.id);
  return {
    role,
    items: items.filter((item) => item.roleLabels.includes(role.label)),
    articles: articles.filter((article) => articlesForRole.includes(article.id)),
  };
}

export async function getReviewItem(type: KnowledgeType, id: string) {
  await requireOperationalRole("admin");
  const item = (await fetchReviewItems([type])).find((candidate) => candidate.id === id) ?? null;
  if (!item) return null;
  const events = await listReviewEvents(type, id);
  return { item, events };
}

export async function listReviewEvents(type: KnowledgeType, recordId: string): Promise<KnowledgeReviewEvent[]> {
  await requireOperationalRole("admin");
  if (!isSupabaseConfigured) return [];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("knowledge_review_events").select("id, knowledge_type, knowledge_record_id, action, previous_status, new_status, reason, changes, created_at, reviewer_profile_id").eq("knowledge_type", type).eq("knowledge_record_id", recordId).order("created_at", { ascending: false });
  if (error) throw error;
  const profileIds = [...new Set((data ?? []).map((row) => String(row.reviewer_profile_id)))];
  const profiles = profileIds.length ? await supabase.from("profiles").select("id, full_name, email").in("id", profileIds) : { data: [], error: null };
  if (profiles.error) throw profiles.error;
  const names = new Map((profiles.data ?? []).map((row) => [String(row.id), String(row.full_name ?? row.email ?? "Reviewer")]));
  return (data ?? []).map((row) => ({
    id: String(row.id),
    knowledgeType: String(row.knowledge_type) as KnowledgeType,
    knowledgeRecordId: String(row.knowledge_record_id),
    action: String(row.action),
    previousStatus: nullableString(row.previous_status),
    newStatus: nullableString(row.new_status),
    reason: nullableString(row.reason),
    changes: objectValue(row.changes),
    createdAt: String(row.created_at),
    reviewerName: names.get(String(row.reviewer_profile_id)) ?? null,
  }));
}

export async function getArticleDetail(id: string) {
  await requireOperationalRole("admin");
  const articles = await fetchArticles(true);
  const article = articles.find((candidate) => candidate.id === id) ?? null;
  if (!article) return null;
  const derived = (await fetchReviewItems()).filter((item) => item.source.articleId === id);
  if (!isSupabaseConfigured) return { article, derived, changes: [], extractionRuns: [] };
  const supabase = await createServerSupabaseClient();
  const [changes, extractionRuns] = await Promise.all([
    supabase.from("knowledge_article_changes").select("id, change_type, previous_content_hash, new_content_hash, previous_source_updated_at, new_source_updated_at, fields_changed, description, detected_at").eq("knowledge_article_id", id).order("detected_at", { ascending: false }),
    supabase.from("knowledge_extraction_runs").select("id, status, started_at, finished_at, article_count, proposed_count, failed_count, extractor_version, error_log").order("started_at", { ascending: false }).limit(10),
  ]);
  if (changes.error) throw changes.error;
  if (extractionRuns.error) throw extractionRuns.error;
  return { article, derived, changes: changes.data ?? [], extractionRuns: extractionRuns.data ?? [] };
}

export async function listAdminArticles(query?: string) {
  await requireOperationalRole("admin");
  const articles = await fetchArticles(false);
  const normalized = query?.trim().toLowerCase();
  return normalized ? articles.filter((article) => [article.title, article.category, article.folder, article.externalId].filter(Boolean).join(" ").toLowerCase().includes(normalized)) : articles;
}

export async function getProcessDetail(id: string) {
  await requireOperationalRole("admin");
  const [result, items] = await Promise.all([getReviewItem("process", id), fetchReviewItems()]);
  if (!result) return null;
  let linkedResourceIds: string[] = [];
  if (isSupabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("knowledge_process_resources").select("resource_id").eq("process_id", id);
    if (error) throw error;
    linkedResourceIds = (data ?? []).map((row) => String(row.resource_id));
  }
  return {
    ...result,
    steps: items.filter((item) => item.knowledgeType === "process_step" && String(item.raw.process_id) === id).sort((left, right) => Number(left.raw.step_number ?? 0) - Number(right.raw.step_number ?? 0)),
    resources: items.filter((item) => item.knowledgeType === "resource" && linkedResourceIds.includes(item.id)),
    resourceOptions: items.filter((item) => item.knowledgeType === "resource"),
    related: items.filter((item) => item.source.articleId === result.item.source.articleId && item.id !== id),
  };
}

export async function getKnowledgeDashboard() {
  await requireOperationalRole("admin");
  const [articles, items] = await Promise.all([fetchArticles(false), fetchReviewItems()]);
  const now = Date.now();
  const recentWindow = 30 * 24 * 60 * 60 * 1000;
  const reviewCounts = items.reduce<Record<string, number>>((counts, item) => {
    counts[item.reviewStatus] = (counts[item.reviewStatus] ?? 0) + 1;
    if (item.isStale) counts.stale = (counts.stale ?? 0) + 1;
    return counts;
  }, {});
  const articleCounts = articles.reduce<Record<string, number>>((counts, article) => {
    counts[article.relevance] = (counts[article.relevance] ?? 0) + 1;
    return counts;
  }, {});
  let latestSync: DbRow | null = null;
  let latestExtraction: DbRow | null = null;
  let lifecycle = { missing: 0, restored: 0 };
  if (isSupabaseConfigured) {
    const supabase = await createServerSupabaseClient();
    const [sync, extraction, changes] = await Promise.all([
      supabase.from("ingestion_runs").select("id, source_type, status, started_at, finished_at, records_seen, records_created, records_updated, records_failed, error_log").eq("source_type", "icu_freshdesk").order("started_at", { ascending: false }).limit(1),
      supabase.from("knowledge_extraction_runs").select("id, source_type, status, started_at, finished_at, article_count, proposed_count, approved_count, skipped_unchanged, failed_count, extractor_version, error_log").eq("source_type", "icu_freshdesk").order("started_at", { ascending: false }).limit(1),
      supabase.from("knowledge_article_changes").select("change_type"),
    ]);
    if (sync.error) throw sync.error;
    if (extraction.error) throw extraction.error;
    if (changes.error) throw changes.error;
    latestSync = (sync.data?.[0] as DbRow | undefined) ?? null;
    latestExtraction = (extraction.data?.[0] as DbRow | undefined) ?? null;
    lifecycle = (changes.data ?? []).reduce((counts, row) => {
      const type = String(row.change_type);
      if (type === "missing") counts.missing += 1;
      if (type === "restored") counts.restored += 1;
      return counts;
    }, lifecycle);
  }
  return {
    articles: {
      total: articles.length,
      critical: articleCounts.critical ?? 0,
      high: articleCounts.high ?? 0,
      medium: articleCounts.medium ?? 0,
      low: articleCounts.low ?? 0,
      changedRecently: articles.filter((article) => article.lastChangedAt && now - new Date(article.lastChangedAt).getTime() <= recentWindow).length,
      missing: articles.filter((article) => article.isStale).length,
      restoredEvents: lifecycle.restored,
      missingEvents: lifecycle.missing,
    },
    derived: {
      requirement: items.filter((item) => item.knowledgeType === "requirement").length,
      timing_rule: items.filter((item) => item.knowledgeType === "timing_rule").length,
      process: items.filter((item) => item.knowledgeType === "process").length,
      resource: items.filter((item) => item.knowledgeType === "resource").length,
      contact: items.filter((item) => item.knowledgeType === "contact").length,
    },
    review: reviewCounts,
    published: items.filter((item) => item.reviewStatus === "approved" && !item.isStale && item.visibility !== "internal").length,
    latestSync,
    latestExtraction,
    attention: (reviewCounts.proposed ?? 0) + (reviewCounts.needs_review ?? 0) + (reviewCounts.stale ?? 0) + Number(latestSync?.records_failed ?? 0) + Number(latestExtraction?.failed_count ?? 0),
  };
}

export async function listPublishedKnowledge(query?: string) {
  if (!isSupabaseConfigured) return [] as KnowledgeReviewItem[];
  await requireOperationalRole("member");
  const items = await fetchReviewItems(Object.keys(derivedTables) as KnowledgeType[], { includeTaxonomy: false, includeSources: false });
  const normalized = query?.trim().toLowerCase();
  return items.filter((item) => item.reviewStatus === "approved" && !item.isStale && (item.visibility === "member" || item.visibility === "public") && (!normalized || [item.normalizedText, item.secondaryText, item.evidenceText, item.topicLabel, ...item.roleLabels].filter(Boolean).join(" ").toLowerCase().includes(normalized)));
}

export async function listAccessibleKnowledge(query?: string) {
  if (!isSupabaseConfigured) return [] as KnowledgeReviewItem[];
  const { profile } = await requireRole("member");
  if (hasMinimumRole(profile.accessRole, "committee")) {
    const items = await fetchReviewItems();
    const normalized = query?.trim().toLowerCase();
    return normalized ? items.filter((item) => [item.normalizedText, item.secondaryText, item.evidenceText, item.source.title, item.topicLabel, ...item.roleLabels].filter(Boolean).join(" ").toLowerCase().includes(normalized)) : items;
  }
  return listPublishedKnowledge(query);
}

export async function getPublishedKnowledgeItem(type: KnowledgeType, id: string) {
  const items = await listPublishedKnowledge();
  return items.find((item) => item.knowledgeType === type && item.id === id) ?? null;
}

export async function getAccessibleKnowledgeItem(type: KnowledgeType, id: string) {
  const items = await listAccessibleKnowledge();
  return items.find((item) => item.knowledgeType === type && item.id === id) ?? null;
}

export async function listPublicResources() {
  if (!isSupabaseConfigured) return [] as DbRow[];
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("public_knowledge_resources").select("id, name, resource_type, url, system_name, anchor_text, description, source_article_title, source_article_url, published_at").order("name");
  if (error) throw error;
  return (data ?? []) as DbRow[];
}

export { derivedTables, typeLabels };
