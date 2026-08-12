import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PasswordForm } from "@/components/auth/password-form";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ flow?: string }> }) {
  const params = await searchParams;
  const mode = params.flow === "setup" ? "setup" : "reset";
  return <main className="auth-page"><section className="auth-aside"><Link className="brand" href="/"><span className="brand-mark">EFDS</span><span className="brand-copy">EFDS Society<small>Imperial College London</small></span></Link><div><div className="eyebrow">Secure account access</div><h1 className="display">Your account,<br /><em>your key.</em></h1><p>Set a password for your approved EFDS email account. Your password is managed by Supabase Auth.</p></div><Link className="button button-quiet" style={{ color: "rgba(247,247,243,.7)" }} href="/login"><ArrowLeft size={14} /> Back to sign in</Link></section><section className="auth-panel"><PasswordForm mode={mode} /></section></main>;
}
