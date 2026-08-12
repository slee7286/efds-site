import Link from "next/link";
import type React from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Database, RefreshCw } from "lucide-react";
import { getKnowledgeDashboard } from "@/lib/db/knowledge-ops";
import { formatDate, KnowledgeAdminNav } from "@/components/knowledge/operations";

function value(row: Record<string, unknown> | null, key: string): string | null {
  const item = row?.[key];
  return item === null || item === undefined ? null : String(item);
}

export default async function AdminKnowledgePage() {
  const dashboard = await getKnowledgeDashboard();
  return <div className="app-content">
    <div className="eyebrow">Admin · knowledge operations</div>
    <h1>Keep the<br />system clear.</h1>
    <p className="app-subtitle">A source-first console for ICU synchronisation, extraction, review, stale knowledge and explicit publication.</p>
    <KnowledgeAdminNav />

    <section className="ops-stat-grid">
      <Stat label="Current ICU articles" value={dashboard.articles.total} note={`${dashboard.articles.changedRecently} changed in 30 days`} href="/admin/knowledge/articles" />
      <Stat label="Needs attention" value={dashboard.attention} note="proposed, deferred, stale or failed" href="/admin/knowledge/review?status=proposed" />
      <Stat label="Approved" value={dashboard.review.approved ?? 0} note="derived records" href="/admin/knowledge/review?status=approved" />
      <Stat label="Stale" value={dashboard.review.stale ?? 0} note="source version changed" href="/admin/knowledge/stale" />
    </section>

    <section style={{ marginTop: 24 }}><div className="eyebrow">Source articles</div><div className="ops-stat-grid" style={{ marginTop: 10 }}>
      <Stat label="Critical" value={dashboard.articles.critical} note="relevance" /><Stat label="High" value={dashboard.articles.high} note="relevance" /><Stat label="Medium" value={dashboard.articles.medium} note="relevance" /><Stat label="Low" value={dashboard.articles.low} note={`missing now: ${dashboard.articles.missing} · restored events: ${dashboard.articles.restoredEvents}`} />
    </div></section>

    <section style={{ marginTop: 28 }}><div className="eyebrow">Derived knowledge</div><div className="ops-link-grid" style={{ marginTop: 10 }}>
      <OpsLink href="/admin/knowledge/requirements" label="Requirements" count={dashboard.derived.requirement} /><OpsLink href="/admin/knowledge/timing" label="Timing rules" count={dashboard.derived.timing_rule} /><OpsLink href="/admin/knowledge/processes" label="Processes" count={dashboard.derived.process} /><OpsLink href="/admin/knowledge/resources" label="Resources" count={dashboard.derived.resource} /><OpsLink href="/admin/knowledge/review?type=contact" label="Contacts" count={dashboard.derived.contact} />
    </div></section>

    <div className="app-grid" style={{ marginTop: 28 }}><section className="surface info-card"><div className="panel-heading"><h2>Review status</h2><Link href="/admin/knowledge/review">Open queue <ArrowRight size={13} /></Link></div><dl className="security-details"><MetricRow label="Proposed" value={dashboard.review.proposed ?? 0} href="/admin/knowledge/review?status=proposed" /><MetricRow label="Needs review" value={dashboard.review.needs_review ?? 0} href="/admin/knowledge/review?status=needs_review" /><MetricRow label="Approved" value={dashboard.review.approved ?? 0} href="/admin/knowledge/review?status=approved" /><MetricRow label="Rejected" value={dashboard.review.rejected ?? 0} href="/admin/knowledge/review?status=rejected" /><MetricRow label="Superseded" value={dashboard.review.superseded ?? 0} href="/admin/knowledge/review?status=superseded" /></dl></section>
      <aside className="surface-dark info-card"><div className="eyebrow" style={{ color: "var(--mint)" }}>System health</div><div style={{ display: "grid", gap: 18, marginTop: 24 }}><HealthRow icon={<RefreshCw size={15} />} label="Latest ICU sync" value={`${value(dashboard.latestSync, "status")} · ${formatDate(value(dashboard.latestSync, "finished_at"))}`} /><HealthRow icon={<Database size={15} />} label="Latest extraction" value={`${value(dashboard.latestExtraction, "status")} · ${formatDate(value(dashboard.latestExtraction, "finished_at"))}`} /><HealthRow icon={dashboard.attention ? <AlertTriangle size={15} color="var(--coral)" /> : <CheckCircle2 size={15} color="var(--mint)" />} label="Attention" value={`${dashboard.attention} record(s)`} /></div></aside>
    </div>
    <p className="muted" style={{ fontSize: 11, marginTop: 16 }}>The counts above are queried from the current Supabase database on each request. No corpus totals are embedded in the interface.</p>
  </div>;
}

function Stat({ label, value, note, href }: { label: string; value: number; note: string; href?: string }) { const content = <div className="surface ops-stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; return href ? <Link href={href} style={{ textDecoration: "none" }}>{content}</Link> : content; }
function OpsLink({ href, label, count }: { href: string; label: string; count: number }) { return <Link className="ops-link surface" href={href}><strong>{label}</strong><span>{count} current record(s) <ArrowRight size={11} /></span></Link>; }
function MetricRow({ label, value, href }: { label: string; value: number; href: string }) { return <div><dt>{label}</dt><dd><Link href={href}>{value}</Link></dd></div>; }
function HealthRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="ops-inline" style={{ alignItems: "start" }}><span>{icon}</span><div><strong style={{ color: "var(--paper)", display: "block", fontSize: 13 }}>{label}</strong><span style={{ color: "rgba(247,247,243,.68)", fontSize: 11 }}>{value}</span></div></div>; }
