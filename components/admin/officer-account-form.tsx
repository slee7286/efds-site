"use client";

import { useFormStatus } from "react-dom";
import { linkOfficerAccount, unlinkOfficerAccount } from "@/lib/actions/officers";
import type { CommitteeIdentity } from "@/lib/db/committee";

function Submit({ label, pendingLabel, quiet = false }: { label: string; pendingLabel: string; quiet?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={`button ${quiet ? "button-quiet" : "button-dark"}`} type="submit" disabled={pending}>{pending ? pendingLabel : label}</button>;
}

export function OfficerAccountForm({ officer }: { officer: CommitteeIdentity }) {
  return <div className="officer-account-list">
    {officer.accounts.map((account) => <form action={unlinkOfficerAccount} className="officer-account-entry" key={account.id}>
      <div><strong>{account.name || account.email}</strong>{account.name && <small>{account.email}</small>}</div>
      <input type="hidden" name="officerId" value={officer.id} />
      <input type="hidden" name="profileId" value={account.id} />
      <input type="hidden" name="version" value={account.version} />
      <Submit label="Remove link" pendingLabel="Removing…" quiet />
    </form>)}
    {officer.accounts.length < 2 && <form action={linkOfficerAccount} className="officer-account-form">
      <input type="hidden" name="officerId" value={officer.id} />
      <label className="form-label" htmlFor={`officer-account-${officer.id}`}>Committee account email</label>
      <input className="input" id={`officer-account-${officer.id}`} name="email" type="email" list="eligible-officer-accounts" placeholder="name@imperial.ac.uk" autoComplete="off" required />
      <Submit label="Link account" pendingLabel="Linking account…" />
    </form>}
  </div>;
}
