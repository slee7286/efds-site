"use client";

import { useState } from "react";
import { z } from "zod";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getGoogleOAuthOptions, GOOGLE_AUTH_PROVIDER } from "@/lib/auth/google";
import { config, isSupabaseConfigured } from "@/lib/config";
import { type EmailAuthIntent, useEmailCooldown } from "@/lib/auth/email-cooldown";

type EmailAction = "password" | "magic" | "setup" | "reset";
const emailSchema = z.string().trim().email().max(320);
const passwordSchema = z.string().min(8, "Your password must be at least 8 characters long.");
const genericEmailMessage = "If this email is eligible for EFDS access, you will receive an email with the next step.";

function intentForAction(action: EmailAction): EmailAuthIntent | null {
  if (action === "setup" || action === "reset") return action;
  return action === "magic" ? "magic_link" : null;
}

export function LoginForm({ initialMessage = "", googleEnabled = false }: { initialMessage?: string; googleEnabled?: boolean }) {
  const [action, setAction] = useState<EmailAction>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [pending, setPending] = useState(false);
  const cooldown = useEmailCooldown(intentForAction(action), email);

  async function signInWithGoogle() {
    setPending(true); setMessage("");
    try {
      if (!googleEnabled) throw new Error("Google sign-in is being configured. Please use the email form.");
      if (!isSupabaseConfigured) throw new Error("Sign-in is unavailable in this local preview. Your account has not been changed.");
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: GOOGLE_AUTH_PROVIDER, options: getGoogleOAuthOptions(config.siteUrl) });
      if (error) throw new Error("We could not start Google sign-in. Use the email form or try again.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not start Google sign-in. Use the email form or try again.");
    } finally {
      setPending(false);
    }
  }

  async function authorizePasswordSession() {
    const response = await fetch("/api/auth/external/authorize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ next: "/dashboard" }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message ?? "This account is not currently authorised for EFDS.");
    return data as { redirect?: string };
  }

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault(); setPending(true); setMessage("");
    const parsedEmail = emailSchema.safeParse(email);
    const parsedPassword = passwordSchema.safeParse(password);
    if (!parsedEmail.success || !parsedPassword.success) {
      setMessage(!parsedEmail.success ? "Enter a valid email address." : parsedPassword.error?.issues[0]?.message ?? "Enter a valid password.");
      setPending(false);
      return;
    }
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({ email: parsedEmail.data.toLowerCase(), password: parsedPassword.data });
      if (error) throw new Error("Email or password is incorrect.");
      const result = await authorizePasswordSession();
      window.location.assign(result.redirect ?? "/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "We could not sign you in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function requestEmail(event: React.FormEvent) {
    event.preventDefault();
    if (pending || cooldown.active) return;
    setPending(true); setMessage("");
    const endpoint = action === "magic" ? "/api/auth/external" : "/api/auth/external/password-email";
    const body = action === "magic" ? { email } : { email, flow: action };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      setMessage(data.message ?? (response.ok ? genericEmailMessage : "We could not send the email. Please try again later."));
      if (response.ok) cooldown.start();
    } catch {
      setMessage("We could not start the secure email flow. Please try again.");
    } finally {
      setPending(false);
    }
  }

  const emailButtonLabel = pending ? "Sending…" : cooldown.active ? `Resend in ${cooldown.seconds}s` : action === "magic" ? "Send secure email link" : action === "setup" ? "Send setup email" : "Send reset email";

  return <div>
    <div className="eyebrow" style={{ marginBottom: 14 }}>Sign in with email</div>
    {action === "password" ? <form onSubmit={signInWithPassword}>
        <label className="auth-label" htmlFor="login-email">Email address</label>
        <input className="auth-input" id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@imperial.ac.uk" />
        <label className="auth-label" htmlFor="login-password">Password</label>
        <input className="auth-input" id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="button button-primary auth-primary-action" disabled={pending} type="submit">{pending ? "Signing in…" : "Sign in with email"}</button>
      </form> : <form onSubmit={requestEmail}>
        <label className="auth-label" htmlFor="login-email">Email address</label>
        <input className="auth-input" id="login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@imperial.ac.uk" />
        <button className="button button-primary auth-primary-action" disabled={pending || cooldown.active} type="submit">{emailButtonLabel}</button>
      </form>}
      <div className="ops-inline" style={{ marginTop: 12, gap: 12, flexWrap: "wrap" }}>
        {action !== "password" && <button className="button button-quiet" type="button" onClick={() => { setAction("password"); setMessage(""); }}>Sign in with password</button>}
        {action === "password" && <><button className="button button-quiet" type="button" onClick={() => setAction("reset")}>Forgot password?</button><button className="button button-quiet" type="button" onClick={() => setAction("magic")}>Sign in by email link</button><button className="button button-quiet" type="button" onClick={() => setAction("setup")}>First time? Set up password</button></>}
      </div>
    <div className="auth-divider">or</div>
    <button className="provider-button" type="button" disabled={pending || !googleEnabled} onClick={signInWithGoogle}><span className="google-mark" aria-hidden="true">G</span>{pending ? "Connecting…" : googleEnabled ? "Continue with Google" : "Google sign-in is being configured"}</button>
    {message && <p className="auth-footnote" role="status">{message}</p>}
  </div>;
}
