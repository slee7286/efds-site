import type { UnprovisionedAccount, UnprovisionedAccountReason } from "@/lib/db/accounts";

const reasons: Record<UnprovisionedAccountReason, { label: string; guidance: string }> = {
  account_disabled: {
    label: "Account disabled",
    guidance: "This Auth account is disabled. Ask an authorised operator to review the restriction; do not bypass it by creating a profile or granting roles.",
  },
  email_unconfirmed: {
    label: "Email confirmation pending",
    guidance: "This person must request a new sign-in or signup email themselves and complete email confirmation. Administrators must not force confirmation or grant roles to bypass this step.",
  },
  email_not_eligible: {
    label: "Email not eligible",
    guidance: "This email is not currently eligible for an application profile. Check the address and the approved external-access process with an authorised operator before proceeding.",
  },
  profile_conflict: {
    label: "Profile conflict",
    guidance: "This registration conflicts with an existing profile. Ask an authorised operator to investigate the identity mismatch; do not create a second account or change roles to work around it.",
  },
  profile_missing: {
    label: "Profile missing",
    guidance: "Email ownership is confirmed, but the application profile is missing. Ask an authorised operator to investigate profile provisioning before reviewing access.",
  },
};

function registrationDate(value: string) {
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });
}

export function UnprovisionedAccounts({ accounts }: { accounts: UnprovisionedAccount[] }) {
  return <section className="account-review-list" aria-labelledby="unprovisioned-accounts-heading">
    <div className="surface account-review-card">
      <div className="panel-heading"><h2 id="unprovisioned-accounts-heading">Registrations without profiles</h2><span>{accounts.length} shown · up to 1,000</span></div>
      <p>These are Auth registrations, not active application accounts. They have no application profile to review or promote. This list is independent of the account filters and pagination above.</p>
    </div>
    {accounts.map((account) => <article className="surface account-review-card" key={account.authUserId}>
      <div className="account-review-identity">
        <div><span className="eyebrow">Registration only</span><h3>{account.fullName || account.email}</h3>{account.fullName && <p>{account.email}</p>}</div>
        <span className="badge badge-neutral">{reasons[account.reason].label}</span>
      </div>
      <div className="account-review-detail">
        <div><span>Registered</span><time dateTime={account.createdAt}>{registrationDate(account.createdAt)}</time></div>
        <div><span>{account.emailConfirmedAt ? "Email confirmed" : "Email not confirmed"}</span>{account.emailConfirmedAt && <time dateTime={account.emailConfirmedAt}>{registrationDate(account.emailConfirmedAt)}</time>}</div>
      </div>
      <p>{reasons[account.reason].guidance}</p>
    </article>)}
    {!accounts.length && <div className="surface empty-state"><h3>No registrations are waiting for a profile.</h3><p>Registrations that have not acquired an application profile will appear here, including those still awaiting email confirmation.</p></div>}
  </section>;
}
