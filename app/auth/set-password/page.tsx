import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PasswordForm } from "@/components/auth/password-form";
import { evaluateUserAccess, getAuthUser, usesMicrosoftAuthentication } from "@/lib/auth/server";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ flow?: string }> }) {
  const params = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const access = await evaluateUserAccess(user);
  if (!access.allowed || usesMicrosoftAuthentication(user)) redirect("/access-denied");
  const mode = params.flow === "setup" ? "setup" : "reset";
  return <main className="auth-page"><section className="auth-aside"><Link className="brand" href="/"><span className="brand-mark">EFDS</span><span className="brand-copy">EFDS Society<small>Imperial College London</small></span></Link><div><div className="eyebrow">Secure account access</div><h1 className="display">Your account,<br /><em>your key.</em></h1><p>Set a password for your approved EFDS email account. Your password is managed by Supabase Auth.</p></div><Link className="button button-quiet" style={{ color: "rgba(247,247,243,.7)" }} href="/login"><ArrowLeft size={14} /> Back to sign in</Link></section><section className="auth-panel"><PasswordForm mode={mode} /></section></main>;
}
