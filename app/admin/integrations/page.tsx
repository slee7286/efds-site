import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/config";
import { getAuthEmailHealth } from "@/lib/db/auth-email-health";
import { getOutlookSyncStatus } from "@/lib/db/tickets";

export const metadata: Metadata = { title: "Integration health" };
export const dynamic = "force-dynamic";

function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London",
    }).format(new Date(value))
    : "No event recorded";
}

export default async function AdminIntegrationsPage() {
  const [email, outlookLastSync] = await Promise.all([getAuthEmailHealth(), getOutlookSyncStatus()]);
  const attention = email.failed24h > 0 || email.quotaSignals24h > 0 || email.bounced7d > 0;
  const noRecentEmail = email.accepted24h === 0 && email.delivered7d === 0;
  const emailStatus = attention ? "Check delivery" : email.awaitingEvent7d > 0 ? "Delivery unverified" : noRecentEmail ? "No recent email" : "No recorded failures";
  return <div className="app-content">
    <div className="eyebrow">Admin · integrations</div>
    <h1>See what is<br />actually working.</h1>
    <p className="app-subtitle">A private view of authentication email handoff and source connections. Counts contain no recipients, links or message bodies.</p>
    <section className="surface info-card" aria-labelledby="auth-email-health-heading">
      <div className="panel-heading"><h2 id="auth-email-health-heading">Authentication email</h2><span className={`badge ${attention ? "badge-coral" : email.awaitingEvent7d > 0 || noRecentEmail ? "badge-neutral" : "badge-mint"}`}>{emailStatus}</span></div>
      <p>Resend is primary; Brevo receives messages only after an explicit primary rejection. An accepted send means the provider took the message. Delivery requires a separate provider callback.</p>
      <div className="metric-grid">
        <Metric label="Accepted · 24h" value={email.accepted24h} note="Provider handoffs" />
        <Metric label="Resend · 24h" value={email.resend24h} note="EFDS hook only" />
        <Metric label="Brevo · 24h" value={email.brevo24h} note="Fallback handoffs" />
        <Metric label="Failed or uncertain · 24h" value={email.failed24h} note="Needs a fresh link after checking mail" />
      </div>
      <div className="app-grid">
        <div className="surface app-panel"><h3>Delivery evidence · 7 days</h3><dl className="security-details"><div><dt>Confirmed by provider</dt><dd>{email.delivered7d}</dd></div><div><dt>Bounced, blocked or complained</dt><dd>{email.bounced7d}</dd></div><div><dt>No callback recorded</dt><dd>{email.awaitingEvent7d}</dd></div><div><dt>Last callback</dt><dd>{date(email.lastDeliveryEventAt)}</dd></div></dl></div>
        <div className="surface app-panel"><h3>Capacity signals</h3><dl className="security-details"><div><dt>Resend quota or rate rejections · 24h</dt><dd>{email.quotaSignals24h}</dd></div><div><dt>Latest handoff</dt><dd>{date(email.lastAttemptAt)}</dd></div></dl><p className="muted">Resend&apos;s free allowance is 100 emails/day. The count here is a rolling 24 hours of this hook only; check the provider dashboard for its actual allowance and other sends.</p><p className="muted">Supabase Auth has separate email and request limits. A 429 there may stop the request before this hook runs; check Authentication → Rate Limits if no handoff appears.</p></div>
      </div>
      {email.quotaSignals24h > 0 && <p className="form-error" role="status" style={{ marginTop: 18 }}>Resend reported a quota or rate rejection. Check Brevo handoffs and provider dashboards before inviting more people.</p>}
      {email.awaitingEvent7d > 0 && <p className="muted" style={{ marginTop: 18 }}>Messages without callbacks may have arrived. Configure both signed provider webhooks before treating this number as a delivery problem.</p>}
      {!isSupabaseConfigured && <p className="muted" style={{ marginTop: 18 }}>Preview values are empty; connected metrics require a configured Supabase project.</p>}
    </section>
    <section className="surface info-card" style={{ marginTop: 20 }} aria-labelledby="source-status-heading"><h2 id="source-status-heading">Other sources</h2>
      <div className="queue-row"><div><h3>Slack and linked meeting notes</h3><p>The scheduled archive refresh runs from the knowledge-base repository. Check its GitHub Actions run for the latest result.</p></div><span className="badge badge-neutral">Scheduled</span></div>
      <div className="queue-row"><div><h3>ICU Union information</h3><p>Public source material is ingested into the knowledge base and reviewed before EFDS publication.</p></div><span className="badge badge-neutral">Review required</span></div>
      <div className="queue-row"><div><h3>Outlook</h3><p>{outlookLastSync ? `Last successful sender-limited sync: ${date(outlookLastSync)}. This does not confirm that mailbox access is still active.` : "No successful sender-limited sync is visible to this session."}</p></div><span className="badge badge-neutral">{outlookLastSync ? "Previously synced" : "Sync unverified"}</span></div>
    </section>
  </div>;
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="metric surface"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
