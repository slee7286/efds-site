import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getKnowledgeTaxonomyOptions, getReviewItem } from "@/lib/db/knowledge-ops";
import { formatDate, PublicationControls, ReviewDetailActions, SourceEvidence, StatusBadge } from "@/components/knowledge/operations";
import { RichKnowledgeEditForm } from "@/components/knowledge/editing";
import type { KnowledgeType } from "@/types/domain";

export default async function ReviewDetailPage({ params, searchParams }: { params: Promise<{ type: string; id: string }>; searchParams?: Promise<{ error?: string }> }) {
  const { type, id } = await params;
  const result = await getReviewItem(type as KnowledgeType, id);
  if (!result) return <div className="app-content"><Link className="button button-quiet" href="/admin/knowledge/review"><ArrowLeft size={14} /> Back to review</Link><div className="empty-state surface" style={{ marginTop: 20 }}><h2>Knowledge record not found</h2><p>It may have been superseded, removed from the current database, or the type/identifier was invalid.</p></div></div>;
  const { item, events } = result;
  const options = await getKnowledgeTaxonomyOptions();
  const query = searchParams ? await searchParams : {};
  return <div className="app-content"><Link className="button button-quiet" href="/admin/knowledge/review"><ArrowLeft size={14} /> Back to review</Link><div style={{ marginTop: 24, maxWidth: 900 }}><div className="eyebrow">{item.knowledgeType.replaceAll("_", " ")} · review detail</div><div className="ops-inline" style={{ justifyContent: "space-between", alignItems: "start" }}><div><h1>{item.normalizedText}</h1><p className="app-subtitle">{item.secondaryText ?? "Source-linked derived knowledge"}</p></div><StatusBadge status={item.reviewStatus} stale={item.isStale} /></div><div className="tag-list"><span className="tag">{item.confidence === null ? "Confidence unknown" : `${Math.round(item.confidence * 100)}% confidence`}</span><span className="tag">{item.extractionMethod}</span><span className="tag">{item.visibility}</span>{item.topicLabel && <span className="tag">{item.topicLabel}</span>}{item.roleLabels.map((role) => <span className="tag" key={role}>{role}</span>)}</div>
    <SourceEvidence item={item} />
    <section className="surface info-card" style={{ marginTop: 18 }}><div className="eyebrow">Current interpretation</div><dl className="security-details"><div><dt>Normalized value</dt><dd>{item.normalizedText}</dd></div><div><dt>Secondary context</dt><dd>{item.secondaryText ?? "—"}</dd></div><div><dt>Review status</dt><dd><StatusBadge status={item.reviewStatus} stale={item.isStale} /></dd></div><div><dt>Last reviewed</dt><dd>{formatDate(item.reviewedAt)}{item.reviewerName ? ` by ${item.reviewerName}` : ""}</dd></div><div><dt>Metadata</dt><dd><code>{JSON.stringify(item.metadata)}</code></dd></div></dl></section>
    {query.error === "concurrency_conflict" && <div className="surface info-card" style={{ marginTop: 18, borderColor: "var(--coral)" }}><strong>This record changed since you opened it.</strong><p>Reload the latest interpretation before making another decision.</p><Link className="button button-quiet" href={`/admin/knowledge/review/${item.knowledgeType}/${item.id}`}>Reload latest version</Link></div>}
    <ReviewDetailActions item={item} /><RichKnowledgeEditForm item={item} topics={options.topics} roles={options.roles} /><PublicationControls item={item} />
    <section className="surface info-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Review history</h2><span className="muted">Append-only events</span></div>{events.length ? <div className="list-card">{events.map((event) => <div className="list-card-item" key={event.id}><div><span className="list-card-meta">{event.action} · {formatDate(event.createdAt)}</span><h3>{event.previousStatus ?? "—"} → {event.newStatus ?? "—"}</h3><p>{event.reason ?? "No reason supplied."}{event.reviewerName ? ` · ${event.reviewerName}` : ""}</p>{Object.keys(event.changes).length > 0 && <code>{JSON.stringify(event.changes)}</code>}</div></div>)}</div> : <p className="muted">No review events have been recorded yet.</p>}</section>
  </div></div>;
}
