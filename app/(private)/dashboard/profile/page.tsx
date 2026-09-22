import { PasswordForm } from "@/components/auth/password-form";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/server";

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const canChangePassword = Boolean(user?.app_metadata?.provider === "email" && profile?.memberType !== "imperial");
  return <div className="app-content"><div className="eyebrow">Identity &amp; access</div><h1>Your profile.</h1><p className="app-subtitle">Your sign-in details and access to the EFDS workspace.</p><div className="surface info-card" style={{ maxWidth: 650 }}><div className="list-card-item" style={{ padding: "0 0 20px" }}><div><span className="list-card-meta">Identity</span><h3>{user ? "Signed-in account" : "Preview account"}</h3><p>{user?.app_metadata?.provider === "email" ? "Approved email account" : "Imperial Microsoft account"}</p></div><span className="badge badge-mint">{user ? "Signed in" : "Preview"}</span></div><div className="list-card-item" style={{ paddingLeft: 0, paddingRight: 0 }}><div><span className="list-card-meta">Authorization</span><h3>{profile?.accessRole ?? "Member"} access</h3><p>Your workspace access is managed by the society.</p></div><span className="badge badge-neutral">{profile?.memberType ?? "member"}</span></div></div>{canChangePassword && <div style={{ marginTop: 18 }}><PasswordForm mode="change" /></div>}</div>;
}
