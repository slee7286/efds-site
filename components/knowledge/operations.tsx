import Link from "next/link";
import { ArrowRight, Check, ExternalLink, History, RotateCcw, X } from "lucide-react";
import { bulkReviewKnowledgeAction, reviewKnowledgeAction } from "@/lib/actions/knowledge-review";
import type { KnowledgeReviewItem, KnowledgeType } from "@/types/domain";

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

export function statusClass(status: string, stale = false) {
  if (stale) return "badge badge-coral";
  if (status === "approved") return "badge badge-mint";
  if (status === "rejected" || status === "superseded") return "badge badge-neutral";
  return "badge badge-coral";
}

export function StatusBadge({ status, stale = false }: { status: string; stale?: boolean }) {
  return <span className={statusClass(status, stale)}>{stale ? "stale · " : ""}{status.replaceAll("_", " ")}</span>;
}

export function KnowledgeAdminNav() {
  const links = [
    ["Overview", "/admin/knowledge"],
    ["Review queue", "/admin/knowledge/review"],
    ["Stale", "/admin/knowledge/stale"],
    ["Articles", "/admin/knowledge/articles"],
    ["Requirements", "/admin/knowledge/requirements"],
    ["Timing", "/admin/knowledge/timing"],
    ["Processes", "/admin/knowledge/processes"],
    ["Resources", "/admin/knowledge/resources"],
    ["Roles", "/admin/knowledge/roles"],
  ] as const;
  return <nav className="tag-list" aria-label="Knowledge operations navigation" style={{ marginBottom: 24 }}>{links.map(([label, href]) => <Link className="tag" href={href} key={href}>{label}</Link>)}</nav>;
}

function HiddenFields({ item, action }: { item: KnowledgeReviewItem; action: string }) {
  return <><input type="hidden" name="action" value={action} /><input type="hidden" name="knowledgeType" value={item.knowledgeType} /><input type="hidden" name="recordId" value={item.id} /><input type="hidden" name="expectedVersion" value={item.reviewVersion} /></>;
}

export function CompactReviewActions({ item }: { item: KnowledgeReviewItem }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    <form action={reviewKnowledgeAction}><HiddenFields item={item} action="approve" /><button className="button button-primary" type="submit" title="Approve"><Check size={13} /> Approve</button></form>
    <form action={reviewKnowledgeAction}><HiddenFields item={item} action="needs_review" /><button className="button button-quiet" type="submit" title="Defer"><History size={13} /> Defer</button></form>
  </div>;
}

export function ReviewTable({ items, showActions = true, bulkActions = false }: { items: KnowledgeReviewItem[]; showActions?: boolean; bulkActions?: boolean }) {
  const table = <table className="ops-table"><thead><tr>{bulkActions && <th>Select</th>}<th>Knowledge</th><th>Source</th><th>Evidence</th><th>Review</th><th>Confidence</th><th>Changed</th>{showActions && <th>Action</th>}</tr></thead><tbody>{items.map((item) => <tr key={`${item.knowledgeType}-${item.id}`}>
    {bulkActions && <td><input type="checkbox" name="selection" value={`${item.knowledgeType}:${item.id}:${item.reviewVersion}`} aria-label={`Select ${item.normalizedText}`} /></td>}
    <td><Link href={`/admin/knowledge/review/${item.knowledgeType}/${item.id}`}><strong>{item.normalizedText}</strong></Link><small>{item.knowledgeType.replaceAll("_", " ")}{item.secondaryText ? ` · ${item.secondaryText}` : ""}</small>{item.topicLabel && <small>{item.topicLabel}</small>}</td>
    <td><Link href={`/admin/knowledge/articles/${item.source.articleId}`}>{item.source.title}</Link><small>{formatDate(item.source.sourceUpdatedAt)}</small></td>
    <td className="ops-evidence">{item.evidenceText || "No evidence captured"}</td>
    <td><StatusBadge status={item.reviewStatus} stale={item.isStale} /><small>{item.visibility}</small></td>
    <td>{item.confidence === null ? "—" : `${Math.round(item.confidence * 100)}%`}<small>{item.extractionMethod}</small></td>
    <td>{formatDate(item.source.lastChangedAt ?? item.source.sourceUpdatedAt)}</td>
    {showActions && <td><CompactReviewActions item={item} /></td>}
  </tr>)}</tbody></table>;
  return <div className="surface" style={{ overflowX: "auto" }}>{bulkActions ? <form action={bulkReviewKnowledgeAction}><div className="ops-inline" style={{ padding: 12 }}><select className="select" name="bulkAction" defaultValue="approve" aria-label="Bulk action"><option value="approve">Approve selected</option><option value="needs_review">Mark selected needs review</option></select><button className="button button-dark" type="submit">Apply to selected (max 25)</button></div>{table}</form> : table}{!items.length && <div className="empty-state"><h2>No matching knowledge.</h2><p>Try widening the filters or run extraction against a current ICU source.</p></div>}</div>;
}

export function ReviewDetailActions({ item }: { item: KnowledgeReviewItem }) {
  return <div className="surface info-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Review action</h2><span className="muted">Admin only</span></div><div style={{ display: "grid", gap: 16 }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><form action={reviewKnowledgeAction}><HiddenFields item={item} action="approve" /><button className="button button-primary" type="submit"><Check size={14} /> Approve current interpretation</button></form><form action={reviewKnowledgeAction}><HiddenFields item={item} action="needs_review" /><button className="button button-quiet" type="submit"><History size={14} /> Needs review</button></form><form action={reviewKnowledgeAction}><HiddenFields item={item} action="supersede" /><button className="button button-quiet" type="submit"><RotateCcw size={14} /> Supersede</button></form></div>
    <form action={reviewKnowledgeAction} style={{ display: "grid", gap: 8 }}><HiddenFields item={item} action="edit_approve" /><label htmlFor={`edit-${item.id}`}><strong>Edit and approve</strong></label><textarea id={`edit-${item.id}`} name="normalizedText" defaultValue={item.normalizedText} rows={4} required /><button className="button button-dark" type="submit"><Check size={14} /> Save interpretation and approve</button></form>
    <form action={reviewKnowledgeAction} style={{ display: "grid", gap: 8 }}><HiddenFields item={item} action="reject" /><label htmlFor={`reason-${item.id}`}><strong>Reject with reason</strong></label><select className="select" name="reason" id={`reason-${item.id}`} defaultValue="false positive" required><option value="false positive">False positive</option><option value="not applicable to EFDS">Not applicable to EFDS</option><option value="duplicate">Duplicate</option><option value="outdated">Outdated</option><option value="descriptive rather than mandatory">Descriptive rather than mandatory</option><option value="incorrectly interpreted">Incorrectly interpreted</option><option value="insufficient evidence">Insufficient evidence</option><option value="other">Other</option></select><button className="button button-outline" type="submit"><X size={14} /> Reject</button></form>
  </div></div>;
}

export function PublicationControls({ item }: { item: KnowledgeReviewItem }) {
  return <div className="surface info-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Publication</h2><span className="muted">Explicit selection</span></div><p className="muted">Only approved, current knowledge can leave the internal boundary. Publication never changes the source article.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><form action={reviewKnowledgeAction}><HiddenFields item={item} action="publish" /><select className="select" name="visibility" defaultValue={item.visibility} aria-label="Visibility"><option value="internal">Internal</option><option value="committee">Committee</option><option value="member">Member</option><option value="public">Public</option></select><button className="button button-primary" type="submit"><Check size={14} /> Set visibility</button></form><form action={reviewKnowledgeAction}><HiddenFields item={item} action="publish" /><input type="hidden" name="visibility" value="internal" /><button className="button button-quiet" type="submit">Keep internal</button></form></div></div>;
}

export function SourceEvidence({ item }: { item: KnowledgeReviewItem }) {
  return <section className="surface info-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Source evidence</h2>{item.source.url && <a className="button button-quiet" href={item.source.url} target="_blank" rel="noreferrer">Open ICU source <ExternalLink size={13} /></a>}</div><p className="ops-quote">{item.evidenceText || "No evidence excerpt was recorded by extraction."}</p><dl className="security-details"><div><dt>Article</dt><dd><Link href={`/admin/knowledge/articles/${item.source.articleId}`}>{item.source.title}</Link></dd></div><div><dt>Source hash</dt><dd><code>{item.source.contentHash ?? "—"}</code></dd></div><div><dt>Source updated</dt><dd>{formatDate(item.source.sourceUpdatedAt)}</dd></div><div><dt>Last source change</dt><dd>{formatDate(item.source.lastChangedAt)}</dd></div><div><dt>Extraction</dt><dd>{item.extractionMethod} · {formatDate(item.extractedAt)}</dd></div></dl></section>;
}
