"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type VerificationFlow = "setup" | "reset" | "magic";

const copy = {
  setup: { title: "Confirm your email.", next: "/auth/set-password?flow=setup" },
  reset: { title: "Reset your password.", next: "/auth/set-password?flow=reset" },
  magic: { title: "Sign in with a code.", next: "/dashboard" },
} as const;

export function VerifyCodeForm({ flow }: { flow: VerificationFlow }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage("");
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: flow === "reset" ? "recovery" : "email",
      });
      if (error) {
        const safeCode = /^[a-z_]{1,48}$/.test(error.code ?? "") ? ` (${error.code})` : "";
        throw new Error(`This code could not be verified${safeCode}. Use the code in your newest EFDS email, or request a fresh email.`);
      }
      const response = await fetch("/api/auth/external/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next: copy[flow].next }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? "We could not open your EFDS account after verification.");
      window.location.assign(result.redirect ?? copy[flow].next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not verify this code. Please try again.");
      setPending(false);
    }
  }

  return <section className="auth-box">
    <div className="eyebrow">Email verification</div>
    <h2>{copy[flow].title}</h2>
    <p>Enter the one-time code from your newest EFDS email. Requesting another email replaces the previous code.</p>
    <form onSubmit={submit}>
      <label className="auth-label" htmlFor="verify-email">Email address</label>
      <input className="auth-input" id="verify-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@imperial.ac.uk" />
      <label className="auth-label" htmlFor="verify-code">One-time code</label>
      <input className="auth-input" id="verify-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="6-digit code" />
      <button className="button button-primary auth-primary-action" disabled={pending} type="submit">{pending ? "Verifying…" : "Verify and continue"}</button>
    </form>
    {message && <p className="auth-footnote" role="alert">{message}</p>}
    <p className="auth-footnote auth-code-help">No code in that email? <Link href={`/login?flow=${flow}`}>Request a fresh email</Link>.</p>
  </section>;
}
