import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { PasswordForm } from "@/components/auth/password-form";
import { ProfileAvatar } from "@/components/dashboard/profile-avatar";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
  const officer = profile?.officerId ? await (async () => {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.from("officers").select("name,role,academic_year").eq("id", profile.officerId).maybeSingle();
    return data;
  })() : null;
  const provider = user?.app_metadata?.provider === "google" ? "Google" : user?.app_metadata?.provider === "email" ? "Email and password" : user ? "Connected account" : "Local preview";
  const canChangePassword = user?.app_metadata?.provider === "email";
  const displayName = profile?.fullName || profile?.email?.split("@")[0] || "Your account";

  return <div className="app-content profile-page">
    <div className="eyebrow">Account / Profile</div>
    <h1>Your profile.</h1>
    <p className="app-subtitle">Manage the details people see in your workspace and review how you sign in.</p>
    <section className="profile-identity" aria-label="Account overview">
      <ProfileAvatar name={profile?.fullName ?? null} email={profile?.email ?? null} avatarPath={profile?.avatarPath ?? null} size={72} />
      <div><strong>{displayName}</strong><span>{profile?.email ?? "Local design preview"}</span></div>
      <span className="badge badge-mint">{profile?.accessRole ?? "Preview"}</span>
    </section>

    <div className="profile-layout">
      <div className="profile-main-column"><ProfileEditor profile={profile} />
        <section className="surface profile-panel" id="account-security" aria-labelledby="account-security-heading">
          <div className="profile-section-heading"><div><span className="eyebrow">Account &amp; security</span><h2 id="account-security-heading">Your sign-in details.</h2></div></div>
          <dl className="profile-details-list">
            <div><dt><Mail size={17} /> Sign-in email</dt><dd>{profile?.email ?? "Not connected"}<small>Your email identifies your account and determines EFDS access. Contact the society if it needs to change.</small></dd></div>
            <div><dt><ShieldCheck size={17} /> Sign-in method</dt><dd>{provider}</dd></div>
          </dl>
          {canChangePassword ? <div className="profile-password"><PasswordForm mode="change" /></div> : user?.app_metadata?.provider === "google" ? <p className="profile-security-note">Your Google account manages your password. You can change it in your Google account settings.</p> : null}
        </section>
      </div>
      <aside className="profile-side-column">
        <section className="surface profile-panel" aria-labelledby="membership-heading">
          <span className="eyebrow">EFDS membership</span><h2 id="membership-heading">Your access.</h2>
          <dl className="profile-membership-list">
            <div><dt>Workspace role</dt><dd>{profile?.accessRole ?? "Preview"}</dd></div>
            <div><dt>Membership</dt><dd>{profile?.memberType ?? "Not connected"}</dd></div>
            {officer && <div><dt>Committee identity</dt><dd>{officer.name}<small>{officer.role} · {officer.academic_year}</small></dd></div>}
          </dl>
          {profile && (profile.accessRole === "committee" || profile.accessRole === "admin") && !officer && <p className="profile-security-note" role="status">Your committee account is active, but no officer role is linked yet. Ask an EFDS admin to connect your roster identity.</p>}
          <p className="profile-security-note">Roles and committee identity are assigned by EFDS. Editing your display name or photo does not change your permissions.</p>
        </section>
      </aside>
    </div>
  </div>;
}
