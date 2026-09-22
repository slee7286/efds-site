import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/public/brand";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";
export const metadata: Metadata = { title: "Member access" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const messages: Record<string, string> = { recovery_expired: "This sign-in link has expired or has already been used. Request a new email.", recovery_unavailable: "This recovery link is incomplete. Request a new email.", auth_failed: "We could not complete sign-in. Please try again." };
  return <main className="auth-page" id="main-content"><section className="auth-aside"><Brand /><div><div className="eyebrow">Your EFDS workspace</div><h1>Connected by<br /><em>curiosity.</em></h1><p>Your place for society knowledge, useful resources and the next question worth asking.</p><DisciplineGraphic type="data" /></div><Link className="button button-quiet" style={{ color: "#c2cada" }} href="/"><ArrowLeft size={15} />Back to the society</Link></section><section className="auth-panel"><div className="auth-box"><div className="eyebrow">Welcome back</div><h2>Sign in to EFDS.</h2><p>Use your Imperial Microsoft account to access your workspace.</p><LoginForm initialMessage={params.error ? messages[params.error] : undefined} /><p className="auth-footnote"><LockKeyhole size={12} /> Your access is checked securely when you sign in. Approved external members can use the email sign-in option.</p></div></section></main>;
}
