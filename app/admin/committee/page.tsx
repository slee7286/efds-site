import Link from "next/link";
import { OfficerAccountForm } from "@/components/admin/officer-account-form";
import { getCommitteeDirectory } from "@/lib/db/committee";

const errors: Record<string, string> = {
  invalid_request: "Enter a valid account email and try again.",
  account_missing: "No active EFDS account uses that email. Ask the officer to finish account setup first.",
  committee_required: "That account needs committee or admin access before it can be linked to an officer role.",
  account_linked: "That account is already linked to another officer role. Remove its current link first.",
  officer_full: "This officer role already has two active accounts. Remove a link before adding another.",
  stale: "This account changed since you opened the roster. Refresh and try again.",
  save_failed: "The account link could not be saved. Refresh and try again.",
};

export default async function AdminCommitteePage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string; mail?: string }> }) {
  const params = await searchParams;
  const { officers, unlinked, recentMembers } = await getCommitteeDirectory();
  const linked = officers.reduce((total, officer) => total + officer.accounts.length, 0);
  const emptyRoles = officers.filter((officer) => officer.accounts.length === 0).length;
  const notice = params.notice === "linked" ? "Account linked to its officer role."
    : params.notice === "unlinked" ? "Account link removed."
    : params.notice === "already_linked" ? "That account is already linked to this officer role."
    : null;
  const mail = params.mail === "queued" ? "An account-change email is queued."
    : params.mail === "accepted" ? "An email provider accepted the account-change notice."
    : params.mail === "attention" ? "The account-change email needs attention in Account review."
    : params.mail === "unavailable" ? "Check Account review for the email's delivery state."
    : null;

  return <div className="app-content committee-admin-page">
    <div className="eyebrow">Admin · committee identity</div>
    <h1>People behind<br />the work.</h1>
    <p className="app-subtitle">Connect up to two committee accounts to each officer roster entry so assigned tickets and role details appear in the right workspaces. Access and roster identity remain separate decisions.</p>
    <Link className="button button-dark" href="/admin/accounts?status=all">Review accounts and assign access</Link>
    {params.error && errors[params.error] && <p className="form-error" role="alert">{errors[params.error]}</p>}
    {notice && <p className={params.mail === "attention" ? "form-error" : "form-success"} role="status">{notice} {mail}</p>}
    <section className="ticket-metrics" aria-label="Committee account status">
      <div><span>Active officers</span><strong>{officers.length}</strong><small>Roster entries</small></div>
      <div><span>Linked accounts</span><strong>{linked}</strong><small>Ready for assigned tickets</small></div>
      <div><span>Awaiting a link</span><strong>{emptyRoles}</strong><small>Officer entries without an account</small></div>
      <div><span>Access without a role</span><strong>{unlinked.length}</strong><small>Committee/admin accounts</small></div>
    </section>
    <section className="committee-directory" id="roster" aria-label="Active officer roster">
      <div className="panel-heading"><h2>Officer roster and account links</h2><span>{officers.length} active</span></div>
      <p className="committee-directory-help">Each officer role can have up to two committee or admin accounts. Enter an existing account email under the matching officer. Suggestions show accounts that do not yet have a roster link. For a new member, verify and promote the account in <Link href="/admin/accounts?status=all">Account review</Link> first.</p>
      <datalist id="eligible-officer-accounts">{unlinked.map((profile) => <option key={profile.email} value={profile.email}>{profile.fullName || profile.role}</option>)}</datalist>
      {officers.length ? <div className="committee-directory-grid">{officers.map((officer) => <article className="surface committee-directory-card" key={officer.id}>
        <div><span className="eyebrow">{officer.academicYear}</span><h3>{officer.name}</h3><p>{officer.role}</p></div>
        <div className="committee-directory-link">
          <span className={`badge ${officer.accounts.length ? "badge-mint" : "badge-neutral"}`}>{officer.accounts.length} of 2 accounts linked</span>
          <OfficerAccountForm officer={officer} />
        </div>
      </article>)}</div> : <div className="surface empty-state"><h2>No active officer entries.</h2><p>The knowledge-base roster has no active officers in this workspace.</p></div>}
    </section>
    <div className="committee-directory-bottom">
      <section className="surface app-panel"><h2>Committee access, no roster link</h2><p>These accounts can access committee tools, but their officer identity is not connected.</p>{unlinked.map((profile) => <div className="queue-row" key={profile.email}><div><strong>{profile.fullName || profile.email}</strong><small>{profile.email}</small></div><span className="badge badge-neutral">{profile.role}</span></div>)}{!unlinked.length && <p className="muted">No committee accounts are missing a roster link.</p>}</section>
      <section className="surface app-panel"><h2>Recent member accounts</h2><p>First sign-in creates a member account. Verify EFDS membership, then grant committee access and link the roster entry.</p>{recentMembers.map((profile) => <div className="queue-row" key={profile.email}><div><strong>{profile.fullName || profile.email}</strong><small>{profile.email}</small></div><span className="badge badge-neutral">{profile.role === "efds_member" ? "EFDS member" : "Member"}</span></div>)}{!recentMembers.length && <p className="muted">No member accounts have signed in yet.</p>}</section>
    </div>
  </div>;
}
