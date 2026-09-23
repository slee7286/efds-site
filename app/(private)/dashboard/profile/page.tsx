import { PasswordForm } from "@/components/auth/password-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const officer = profile?.officerId ? await (async () => {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from("officers").select("name,role,academic_year").eq("id", profile.officerId).maybeSingle();
    return data;
  })() : null;
  const canChangePassword = Boolean(user?.app_metadata?.provider === "email");
  const identity = user?.app_metadata?.provider === "google" ? "Google account" : user?.app_metadata?.provider === "email" ? "Email account" : user ? "Connected account" : "Local preview";
  return <div className="app-content"><div className="eyebrow">Identity &amp; access</div><h1>Your profile.</h1><p className="app-subtitle">Your sign-in details and access to the EFDS workspace.</p><div className="surface info-card" style={{ maxWidth: 650 }}><div className="list-card-item" style={{ padding: "0 0 20px" }}><div><span className="list-card-meta">Identity</span><h3>{user ? "Signed-in account" : "Preview account"}</h3><p>{profile?.email ?? identity}{profile?.email && ` · ${identity}`}</p></div><span className="badge badge-mint">{user ? "Signed in" : "Preview"}</span></div><div className="list-card-item" style={{ paddingLeft: 0, paddingRight: 0 }}><div><span className="list-card-meta">Authorization</span><h3>{profile?.accessRole ?? "Member"} access</h3><p>Your workspace access is managed by the society.</p></div><span className="badge badge-neutral">{profile?.memberType ?? "member"}</span></div>{officer && <div className="list-card-item" style={{ paddingLeft: 0, paddingRight: 0 }}><div><span className="list-card-meta">Committee identity</span><h3>{officer.name}</h3><p>{officer.role} · {officer.academic_year}</p></div><span className="badge badge-mint">Linked</span></div>}{profile && (profile.accessRole === "committee" || profile.accessRole === "admin") && !officer && <p className="auth-footnote" role="status">Your committee account is active, but no officer role is linked yet. Ask an EFDS admin to connect your roster identity.</p>}</div>{canChangePassword && <div style={{ marginTop: 18 }}><PasswordForm mode="change" /></div>}</div>;
}
