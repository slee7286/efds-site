import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DailySlackRecap } from "@/components/slack/daily-recap";
import { isSupabaseConfigured } from "@/lib/config";
import { getKnowledgeDashboard } from "@/lib/db/knowledge-ops";
import { getDailySlackRecap } from "@/lib/db/slack-recap";

export default async function AdminPage() {
  const [dashboard, recap] = await Promise.all([getKnowledgeDashboard(), getDailySlackRecap()]);
  return <div className="app-content">
    <div className="eyebrow">EFDS operations</div>
    <h1>Keep the<br />system clear.</h1>
    <p className="app-subtitle">The knowledge operations surface keeps ICU source, extraction, review and publication decisions visible in one place.</p>
    <div className="metric-grid">
      <Metric label="ICU articles" value={dashboard.articles.total} note={`${dashboard.articles.high + dashboard.articles.critical} high or critical`} />
      <Metric label="Review attention" value={dashboard.attention} note="proposed, stale or failed" />
      <Metric label="Approved" value={dashboard.review.approved ?? 0} note="derived records" />
      <Metric label="Published" value={dashboard.published} note="explicit visibility" />
    </div>
    {isSupabaseConfigured && <DailySlackRecap recap={recap} basePath="/admin/slack" />}
    <div className="app-grid">
      <section className="surface app-panel">
        <div className="panel-heading"><h2>Knowledge operations</h2><Link href="/admin/knowledge">Open dashboard <ArrowRight size={12} /></Link></div>
        <div className="queue-row"><div><h3>Review queue</h3><p>{dashboard.review.proposed ?? 0} proposed · {dashboard.review.needs_review ?? 0} deferred</p></div><Link className="badge badge-coral" href="/admin/knowledge/review?status=proposed">Review</Link></div>
        <div className="queue-row"><div><h3>Stale knowledge</h3><p>{dashboard.review.stale ?? 0} records are tied to an older ICU source hash</p></div><Link className="badge badge-coral" href="/admin/knowledge/stale">Open</Link></div>
        <div className="queue-row"><div><h3>Source health</h3><p>Latest sync: {String(dashboard.latestSync?.status ?? "not connected")}</p></div><Link className="badge badge-neutral" href="/admin/knowledge#source-health">Inspect</Link></div>
      </section>
      <aside className="surface-dark app-panel">
        <div className="eyebrow" style={{ color: "var(--mint)" }}>Publication boundary</div>
        <h2 style={{ fontSize: 20, fontWeight: 500, marginTop: 26 }}>Selection stays explicit.</h2>
        <p style={{ color: "rgba(247,247,243,.68)", fontSize: 12, lineHeight: 1.5 }}>Approved knowledge remains internal until an administrator explicitly chooses committee, member or public visibility.</p>
        <Link className="button button-primary" href="/admin/knowledge/review?status=approved" style={{ marginTop: 20 }}>Review approved records</Link>
      </aside>
    </div>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="metric surface"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
