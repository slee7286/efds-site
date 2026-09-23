"use client";

import { useFormStatus } from "react-dom";

export function MembershipSubmit({ updating }: { updating: boolean }) {
  const { pending } = useFormStatus();
  return <button className="button button-dark" type="submit" disabled={pending}>{pending ? "Sending for review…" : updating ? "Update review details" : "Send for review"}</button>;
}
