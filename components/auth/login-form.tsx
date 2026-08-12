"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getMicrosoftOAuthOptions, MICROSOFT_AUTH_PROVIDER } from "@/lib/auth/microsoft";

export function LoginForm() {
  const [external, setExternal] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function signInWithMicrosoft() {
    setPending(true); setMessage("");
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({ provider: MICROSOFT_AUTH_PROVIDER, options: getMicrosoftOAuthOptions(window.location.origin) });
    if (error) setMessage(error.message);
    setPending(false);
  }

  async function requestMagicLink(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    try {
      const response = await fetch("/api/auth/external", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json();
      setMessage(data.message ?? "If this email is approved for EFDS external access, a sign-in link is on its way.");
    } catch {
      setMessage("We could not start the secure sign-in flow. Please try again.");
    }
    setPending(false);
  }

  return <div>
    <button className="microsoft-button" disabled={pending} onClick={signInWithMicrosoft}><span className="ms-icon"><i /><i /><i /><i /></span>{pending ? "Connecting…" : "Continue with Microsoft"}</button>
    <div className="auth-divider">or</div>
    {!external ? <button className="auth-submit" onClick={() => setExternal(true)}>Approved email user? Sign in with email →</button> : <form onSubmit={requestMagicLink}><label className="auth-label" htmlFor="external-email">Approved email address</label><input className="auth-input" id="external-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /><button className="auth-submit" disabled={pending} type="submit">Send secure magic link →</button></form>}
    {message && <p className="auth-footnote" role="status">{message}</p>}
  </div>;
}
