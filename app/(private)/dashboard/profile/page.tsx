import type { Metadata } from "next";
import { Mail, ShieldCheck } from "lucide-react";
import { PasswordForm } from "@/components/auth/password-form";
import { ProfileAvatar } from "@/components/dashboard/profile-avatar";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { MembershipSubmit } from "@/components/dashboard/membership-submit";
import { requestMembershipReview } from "@/lib/actions/accounts";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/server";
import { roleLabel } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ membership?: string }> }) {
  const { membership } = await searchParams;
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
      <span className="badge badge-mint">{profile ? roleLabel(profile.accessRole) : "Preview"}</span>
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
            <div><dt>Workspace role</dt><dd>{profile ? roleLabel(profile.accessRole) : "Preview"}</dd></div>
            <div><dt>Account affiliation</dt><dd>{profile?.memberType ?? "Not connected"}</dd></div>
            <div><dt>EFDS membership</dt><dd>{profile?.verificationStatus ?? "Not connected"}</dd></div>
            {officer && <div><dt>Committee identity</dt><dd>{officer.name}<small>{officer.role} · {officer.academic_year}</small></dd></div>}
          </dl>
          {profile && (profile.accessRole === "committee" || profile.accessRole === "admin") && !officer && <p className="profile-security-note" role="status">Your committee account is active, but no officer role is linked yet. Ask an EFDS admin to connect your roster identity.</p>}
          {profile?.accessRole === "member" && <div className="membership-request">
            <p className="profile-security-note">Basic members can explore events and public resources. Verified EFDS members gain access to member resources when they are published.</p>
            <h3>Request EFDS membership review</h3>
            <p>Tell the committee how you are connected to EFDS. An Imperial email alone does not confirm society membership.</p>
            {membership === "saved" && <p role="status" className="membership-feedback">Your details were saved for admin review.</p>}
            {membership === "invalid" && <p role="alert" className="form-error">Please enter 10 to 500 characters.</p>}
            {membership === "failed" && <p role="alert" className="form-error">Your request could not be saved. Try again.</p>}
            <form action={requestMembershipReview}>
              <label className="form-label" htmlFor="membership-claim">Your connection to EFDS
                <textarea className="textarea" id="membership-claim" name="claim" rows={4} minLength={10} maxLength={500} required defaultValue={profile.verificationClaim ?? ""} placeholder="For example, your EFDS membership confirmation or the society activity you joined" />
              </label>
              <MembershipSubmit updating={Boolean(profile.verificationClaim)} />
            </form>
            {profile.verificationStatus === "declined" && <p className="profile-security-note">Your previous request was declined. You can update your details for another review.</p>}
          </div>}
          <p className="profile-security-note">Roles and committee identity are assigned by EFDS. Editing your display name or photo does not change your permissions.</p>
        </section>
      </aside>
    </div>
  </div>;
}
