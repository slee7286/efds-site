import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { Brand } from "@/components/public/brand";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";
import { isGoogleSignInAvailable } from "@/lib/auth/provider-availability";
import { evaluateUserAccess, getAuthUser } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create account" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (isSupabaseConfigured) {
    const user = await getAuthUser();
    if (user && (await evaluateUserAccess(user)).allowed) redirect("/dashboard");
  }
  const googleEnabled = await isGoogleSignInAvailable();
  return <main className="auth-page" id="main-content"><section className="auth-aside"><Brand /><div><div className="eyebrow">Join the workspace</div><h1>Make your<br /><em>account.</em></h1><p>Explore events and the tools open to everyone with an EFDS account.</p><DisciplineGraphic type="data" /></div><Link className="button button-quiet" style={{ color: "#c2cada" }} href="/"><ArrowLeft size={15} />Back to the society</Link></section><section className="auth-panel"><div className="auth-box"><div className="eyebrow">Create account</div><h2>Start as a member.</h2><p>Enter your Imperial email and open the secure link we send you. After confirming your email, you can set a password and enter the dashboard immediately. EFDS membership and committee roles are granted separately by an administrator.</p><LoginForm initialAction="setup" googleEnabled={googleEnabled} /><p className="auth-footnote"><LockKeyhole size={12} /> Already have an account? <Link href="/login">Sign in</Link>.</p></div></section></main>;
}
