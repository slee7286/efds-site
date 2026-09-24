import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/public/brand";
import { VerifyCodeForm, type VerificationFlow } from "@/components/auth/verify-code-form";

export const metadata: Metadata = { title: "Verify email code" };

export default async function VerifyCodePage({ searchParams }: { searchParams: Promise<{ flow?: string }> }) {
  const params = await searchParams;
  const flow: VerificationFlow = params.flow === "reset" || params.flow === "magic" ? params.flow : "setup";
  return <main className="auth-page" id="main-content">
    <section className="auth-aside"><Brand /><div><div className="eyebrow">Secure account access</div><h1 className="display">Check your<br /><em>inbox.</em></h1><p>Confirm your email address to open your EFDS account.</p></div><Link className="button button-quiet" style={{ color: "rgba(247,247,243,.7)" }} href="/login"><ArrowLeft size={14} /> Back to sign in</Link></section>
    <section className="auth-panel"><VerifyCodeForm flow={flow} /></section>
  </main>;
}
