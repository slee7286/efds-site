import Link from "next/link";
import type { Metadata } from "next";
import { AccountReviewForm } from "@/components/admin/account-review-form";
import { getCurrentProfile } from "@/lib/auth/server";
import { roleLabel } from "@/lib/auth/roles";
import { getAccountNoticeHealth, getAccountReviewData } from "@/lib/db/accounts";

export const metadata: Metadata = { title: "Account review" };

const errors: Record<string, string> = {
  invalid_request: "The review details were invalid. Refresh and try again.",
  officer_required: "Choose an officer roster entry.",
  stale: "This account changed since you opened it. Review the latest details and try again.",
  officer_full: "This officer role already has two active accounts. Remove a link before adding another.",
  review_failed: "The review could not be saved. Check the account and try again.",
};

export default async function AdminAccountsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string; error?: string; notice?: string }> }) {
  const params = await searchParams;
  const status = params.status === "all" ? "all" : params.status === "standard" ? "standard" : "pending";
  const requestedPage = Number(params.page);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 && requestedPage <= 1000 ? requestedPage : 1;
  const [data, actor, noticeHealth] = await Promise.all([getAccountReviewData(status, page), getCurrentProfile(), getAccountNoticeHealth()]);
  const names = new Map(data.accounts.map((account) => [account.id, account.fullName || account.email]));

  return <div className="app-content account-review-page">
    <div className="eyebrow">Admin · identity and access</div>
    <h1>Know who has<br />access.</h1>
    <p className="app-subtitle">Review EFDS membership before granting resource access. Committee and admin roles are separate decisions, recorded with the reviewer and date.</p>
    {params.error && errors[params.error] && <p className="form-error account-review-message" role="alert">{errors[params.error]}</p>}
    {params.notice === "queued" && <p className="account-review-message" role="status">Decision saved. The account email is queued and normally sent within a minute.</p>}
    {params.notice === "accepted" && <p className="account-review-message" role="status">Decision saved. An email provider accepted the account notification.</p>}
    {params.notice === "attention" && <p className="form-error account-review-message" role="alert">Decision saved, but its email needs attention. Check notification delivery below.</p>}
    {params.notice === "unchanged" && <p className="account-review-message" role="status">Decision saved. Account access did not change, so no new email was sent.</p>}
    {params.notice === "unavailable" && <p className="form-error account-review-message" role="alert">Decision saved. Email status could not be confirmed; check notification delivery below.</p>}
    <section className="account-review-intro surface" aria-label="Review guidance">
      <div><strong>{data.pendingCount}</strong><span>accounts awaiting EFDS membership review</span></div>
      <p>An Imperial email confirms university affiliation, not society membership. Check the claim against an independent EFDS membership or committee record before approving. New accounts retain full event access while their resource access remains limited.</p>
    </section>
    <section className="surface account-review-intro" aria-label="Account email delivery">
      <div><strong>{noticeHealth ? noticeHealth.pending + noticeHealth.sending : "—"}</strong><span>account emails awaiting provider acceptance</span></div>
      <p>{noticeHealth
        ? <>{noticeHealth.accepted7d} accepted by an email provider in the last 7 days. {noticeHealth.needsAttention > 0
          ? <strong role="alert">{noticeHealth.needsAttention} need investigation before another send.</strong>
          : "No delivery attempts currently need investigation."} Provider acceptance does not confirm an inbox read.</>
        : "Email delivery status is temporarily unavailable. Check the mail worker and database migration."}</p>
    </section>
    <nav className="account-review-tabs" aria-label="Account review filters">
      <Link href="/admin/accounts" aria-current={status === "pending" ? "page" : undefined}>Needs review <span>{data.pendingCount}</span></Link>
      <Link href="/admin/accounts?status=standard" aria-current={status === "standard" ? "page" : undefined}>Standard members <span>{data.standardCount}</span></Link>
      <Link href="/admin/accounts?status=all" aria-current={status === "all" ? "page" : undefined}>All active accounts</Link>
      <Link href="/admin/committee">Officer roster ↗</Link>
    </nav>
    <section className="account-review-list" aria-label="Accounts">
      {data.accounts.map((account) => <article className="surface account-review-card" key={account.id}>
        <div className="account-review-identity"><div><span className="eyebrow">{account.memberType} account</span><h2>{account.fullName || account.email}</h2><p>{account.email}</p></div><div className="account-review-badges"><span className="badge badge-neutral">{roleLabel(account.role)}</span><span className={`badge ${account.verificationStatus === "approved" ? "badge-mint" : "badge-neutral"}`}>{account.verificationStatus === "declined" ? "Standard member" : account.verificationStatus === "approved" ? "EFDS verified" : "Needs review"}</span></div></div>
        <div className="account-review-detail"><div><span>Joined</span><strong>{new Date(account.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" })}</strong></div><div><span>Membership claim</span><p>{account.claim || "No claim submitted yet. Verify against a trusted society record before approval."}</p></div></div>
        <AccountReviewForm account={account} officers={data.officers} isSelf={account.id === actor?.id} />
      </article>)}
      {!data.accounts.length && <div className="surface empty-state"><h2>{status === "pending" ? "No accounts need review." : status === "standard" ? "No standard-member decisions yet." : "No active accounts found."}</h2><p>{status === "pending" ? "New accounts will appear here after their first sign-in." : status === "standard" ? "Accounts confirmed as standard members will appear here and can be verified later." : "Accounts appear after people complete sign-in."}</p></div>}
    </section>
    {data.accountCount > 25 && <nav className="account-review-pagination" aria-label="Account pages"><span>Page {page} of {Math.ceil(data.accountCount / 25)}</span><div>{page > 1 && <Link className="button button-quiet" href={`/admin/accounts?status=${status}&page=${page - 1}`}>Previous</Link>}{page * 25 < data.accountCount && <Link className="button button-quiet" href={`/admin/accounts?status=${status}&page=${page + 1}`}>Next</Link>}</div></nav>}
    <section className="surface account-review-history" aria-labelledby="account-review-history-heading"><div className="panel-heading"><h2 id="account-review-history-heading">Recent access decisions</h2><span>Latest 20</span></div>{data.events.length ? <ol>{data.events.map((event) => <li key={event.id}><strong>{event.action === "decline" ? "Confirmed standard membership" : event.action.replaceAll("_", " ")}</strong><span>{names.get(event.targetProfileId) ?? "Account"} · by {names.get(event.actorProfileId) ?? "EFDS admin"}</span><time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" })}</time>{event.reason && <p>{event.reason}</p>}</li>)}</ol> : <p className="muted">No access decisions have been recorded through this review panel yet.</p>}</section>
  </div>;
}
