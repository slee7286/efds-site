"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { reviewAccount } from "@/lib/actions/accounts";
import type { OfficerOption, ReviewAccount } from "@/lib/db/accounts";

type Action = "verify" | "decline" | "promote_committee" | "promote_admin" | "demote_member" | "link_officer";

function SubmitReview() {
  const { pending } = useFormStatus();
  return <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Saving review…" : "Save decision"}</button>;
}

export function AccountReviewForm({ account, officers, isSelf }: { account: ReviewAccount; officers: OfficerOption[]; isSelf: boolean }) {
  const available: { value: Action; label: string }[] = isSelf
    ? [{ value: "link_officer", label: "Link committee identity" }]
    : account.role === "admin" || account.role === "committee"
    ? [
      ...(account.role === "committee" ? [{ value: "promote_admin" as const, label: "Grant admin access" }] : []),
      { value: "link_officer", label: "Link committee identity" },
      { value: "demote_member", label: "Remove elevated access" },
    ]
    : account.verificationStatus === "approved"
      ? [{ value: "promote_committee", label: "Grant committee access" }, { value: "promote_admin", label: "Grant admin access" }]
      : account.verificationStatus === "declined"
        ? [{ value: "verify", label: "Verify EFDS membership" }]
        : [{ value: "verify", label: "Verify EFDS membership" }, { value: "decline", label: "Confirm standard membership" }];
  const [action, setAction] = useState<Action>(available[0].value);
  const needsOfficer = action === "link_officer";

  return <form action={reviewAccount} className="account-review-form">
    <input type="hidden" name="profileId" value={account.id} />
    <input type="hidden" name="version" value={account.version} />
    <label className="form-label">Decision
      <select className="select" name="action" value={action} onChange={(event) => setAction(event.target.value as Action)}>
        {available.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
    {needsOfficer && <label className="form-label">Officer roster entry
      <select className="select" name="officerId" defaultValue="" required>
        <option value="" disabled>Choose an officer</option>
        {officers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name} · {officer.role} ({officer.academicYear})</option>)}
      </select>
    </label>}
    <div className="account-review-actions"><SubmitReview />{isSelf && <small>Your own role cannot be changed here.</small>}</div>
  </form>;
}
