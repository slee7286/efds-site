import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/public/brand";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";
import { isGoogleSignInAvailable } from "@/lib/auth/provider-availability";
export const metadata: Metadata = { title: "Member access" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const googleEnabled = await isGoogleSignInAvailable();
  const messages: Record<string, string> = { recovery_expired: "This sign-in link has expired or has already been used. Request a new email.", recovery_unavailable: "This recovery link is incomplete. Request a new email.", auth_unconfigured: "Sign-in is unavailable right now. Please try again later.", auth_failed: "We could not complete sign-in. Please try again." };
  return <main className="auth-page" id="main-content"><section className="auth-aside"><Brand /><div><div className="eyebrow">Member access</div><h1>Your EFDS<br /><em>workspace.</em></h1><p>Society knowledge, opportunities and the tools you need to get involved.</p><DisciplineGraphic type="data" /></div><Link className="button button-quiet" style={{ color: "#c2cada" }} href="/"><ArrowLeft size={15} />Back to the society</Link></section><section className="auth-panel"><div className="auth-box"><div className="eyebrow">Welcome back</div><h2>Sign in to EFDS.</h2><p>Use your email and password or request a secure email link{googleEnabled ? ", or continue with Google" : ""}.</p><LoginForm googleEnabled={googleEnabled} initialMessage={params.error ? messages[params.error] : undefined} /><p className="auth-footnote"><LockKeyhole size={12} /> EFDS checks access after sign-in. Imperial email addresses and approved external accounts are eligible.</p></div></section></main>;
}
