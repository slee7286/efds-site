"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type PasswordFormMode = "setup" | "reset" | "change";

const labels: Record<PasswordFormMode, { eyebrow: string; title: string; button: string }> = {
  setup: { eyebrow: "Verified email account", title: "Set your EFDS password.", button: "Set password" },
  reset: { eyebrow: "Password recovery", title: "Choose a new password.", button: "Update password" },
  change: { eyebrow: "Password", title: "Change your password.", button: "Change password" },
};

export function PasswordForm({ mode }: { mode: PasswordFormMode }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; kind: "error" | "success" } | null>(null);
  const [pending, setPending] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const copy = labels[mode];

  async function authorize() {
    const response = await fetch("/api/auth/external/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ next: "/dashboard" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message ?? "Your EFDS access could not be verified.");
    return data as { redirect?: string };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(null);
    if (password.length < 8) {
      setFeedback({ message: "Your password must be at least 8 characters long.", kind: "error" });
      return;
    }
    if (password !== confirmation) {
      setFeedback({ message: "The passwords do not match.", kind: "error" });
      return;
    }

    setPending(true);
    let step: "access" | "password" | "workspace" = "access";
    try {
      await authorize();
      step = "password";
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setPassword("");
      setConfirmation("");
      if (mode === "change") {
        setFeedback({ message: "Your password has been changed.", kind: "success" });
      } else {
        step = "workspace";
        const result = await authorize();
        window.location.assign(result.redirect ?? "/dashboard");
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Please try again.";
      if (step === "workspace") {
        setPasswordUpdated(true);
        setFeedback({ message: "Your password was updated, but we could not open the workspace. Sign in with your new password.", kind: "success" });
      } else if (step === "password") {
        setFeedback({ message: `Your password was not changed: ${detail}`, kind: "error" });
      } else {
        setFeedback({ message: `We could not verify your EFDS access: ${detail}`, kind: "error" });
      }
    } finally {
      setPending(false);
    }
  }

  return <section className="auth-box">
    <div className="eyebrow">{copy.eyebrow}</div>
    <h2>{copy.title}</h2>
    <p>Use a password you do not reuse elsewhere. EFDS never stores your password.</p>
    <form onSubmit={submit}>
      <label className="auth-label" htmlFor={`${mode}-password`}>New password</label>
      <input className="auth-input" id={`${mode}-password`} type={showPassword ? "text" : "password"} autoComplete={mode === "change" ? "new-password" : "new-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
      <label className="auth-label" htmlFor={`${mode}-confirmation`}>Confirm password</label>
      <input className="auth-input" id={`${mode}-confirmation`} type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
      <label className="auth-footnote" style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} /> Show passwords</label>
      <button className="auth-submit" disabled={pending || passwordUpdated} type="submit">{pending ? "Updating…" : copy.button}</button>
    </form>
    {feedback && <p className="auth-footnote" role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p>}
    {passwordUpdated && <Link href="/login">Sign in with your new password</Link>}
  </section>;
}
