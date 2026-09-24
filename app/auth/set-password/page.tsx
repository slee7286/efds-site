import { Brand } from "@/components/public/brand";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PasswordForm } from "@/components/auth/password-form";
import { evaluateUserAccess, getAuthUser } from "@/lib/auth/server";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ flow?: string }> }) {
  const params = await searchParams;
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const access = await evaluateUserAccess(user);
  if (!access.allowed) redirect("/access-denied");
  const mode = params.flow === "setup" ? "setup" : "reset";
  return <main className="auth-page" id="main-content"><section className="auth-aside"><Brand /><div><div className="eyebrow">Secure account access</div><h1 className="display">Set your<br /><em>password.</em></h1><p>Set a password for your verified email account. Your password is handled securely by our sign-in service.</p></div><Link className="button button-quiet" style={{ color: "rgba(247,247,243,.7)" }} href="/login"><ArrowLeft size={14} /> Back to sign in</Link></section><section className="auth-panel"><PasswordForm mode={mode} /></section></main>;
}
