"use client";

import { useFormStatus } from "react-dom";
import { linkOfficerAccount, unlinkOfficerAccount } from "@/lib/actions/officers";
import type { CommitteeIdentity } from "@/lib/db/committee";

function Submit({ label, pendingLabel, quiet = false }: { label: string; pendingLabel: string; quiet?: boolean }) {
  const { pending } = useFormStatus();
  return <button className={`button ${quiet ? "button-quiet" : "button-dark"}`} type="submit" disabled={pending}>{pending ? pendingLabel : label}</button>;
}

export function OfficerAccountForm({ officer }: { officer: CommitteeIdentity }) {
  if (officer.profileId && officer.profileVersion !== null) return <form action={unlinkOfficerAccount} className="officer-account-form">
    <input type="hidden" name="officerId" value={officer.id} />
    <input type="hidden" name="profileId" value={officer.profileId} />
    <input type="hidden" name="version" value={officer.profileVersion} />
    <Submit label="Remove account link" pendingLabel="Removing link…" quiet />
  </form>;

  return <form action={linkOfficerAccount} className="officer-account-form">
    <input type="hidden" name="officerId" value={officer.id} />
    <label className="form-label" htmlFor={`officer-account-${officer.id}`}>Committee account email</label>
    <input className="input" id={`officer-account-${officer.id}`} name="email" type="email" list="eligible-officer-accounts" placeholder="name@imperial.ac.uk" autoComplete="off" required />
    <Submit label="Link account" pendingLabel="Linking account…" />
  </form>;
}
