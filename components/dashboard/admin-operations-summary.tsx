import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getKnowledgeDashboard } from "@/lib/db/knowledge-ops";

export async function AdminOperationsSummary() {
  const dashboard = await getKnowledgeDashboard();

  return <section className="society-admin-overview" aria-labelledby="knowledge-operations-heading">
    <div className="ticket-cluster-heading"><div><span>Admin view</span><h2 id="knowledge-operations-heading">Knowledge and review health</h2></div><Link href="/admin/knowledge">Open knowledge dashboard <ArrowRight size={14} /></Link></div>
    <div className="metric-grid">
      <Metric label="ICU articles" value={dashboard.articles.total} note={`${dashboard.articles.high + dashboard.articles.critical} high or critical`} />
      <Metric label="Review attention" value={dashboard.attention} note="proposed, stale or failed" />
      <Metric label="Approved" value={dashboard.review.approved ?? 0} note="derived records" />
      <Metric label="Published" value={dashboard.published} note="explicit visibility" />
    </div>
    <div className="app-grid">
      <section className="surface app-panel">
        <div className="panel-heading"><h3>Knowledge operations</h3><Link href="/admin/knowledge">Open dashboard <ArrowRight size={12} /></Link></div>
        <div className="queue-row"><div><h3>Review queue</h3><p>{dashboard.review.proposed ?? 0} proposed · {dashboard.review.needs_review ?? 0} deferred</p></div><Link className="badge badge-coral" href="/admin/knowledge/review?status=proposed">Review</Link></div>
        <div className="queue-row"><div><h3>Stale knowledge</h3><p>{dashboard.review.stale ?? 0} records are tied to an older ICU source hash</p></div><Link className="badge badge-coral" href="/admin/knowledge/stale">Open</Link></div>
        <div className="queue-row"><div><h3>Source health</h3><p>Latest sync: {String(dashboard.latestSync?.status ?? "not connected")}</p></div><Link className="badge badge-neutral" href="/admin/knowledge#source-health">Inspect</Link></div>
      </section>
      <aside className="surface-dark app-panel">
        <div className="eyebrow" style={{ color: "var(--mint)" }}>Publication boundary</div>
        <h3 style={{ fontSize: 20, fontWeight: 500, marginTop: 26 }}>Selection stays explicit.</h3>
        <p style={{ color: "rgba(247,247,243,.68)", fontSize: 12, lineHeight: 1.5 }}>Approved knowledge remains internal until an administrator explicitly chooses committee, member or public visibility.</p>
        <Link className="button button-primary" href="/admin/knowledge/review?status=approved" style={{ marginTop: 20 }}>Review approved records</Link>
      </aside>
    </div>
  </section>;
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="metric surface"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
