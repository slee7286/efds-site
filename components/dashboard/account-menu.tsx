"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Settings2, UserRound } from "lucide-react";
import { ProfileAvatar } from "@/components/dashboard/profile-avatar";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AccessProfile, AccessRole } from "@/types/domain";

type AccountSummary = Pick<AccessProfile, "fullName" | "email" | "avatarPath">;

export function AccountMenu({ profile, role, preview }: { profile: AccountSummary | null; role: AccessRole; preview: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const details = useRef<HTMLDetailsElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const name = profile?.fullName?.trim() || profile?.email?.split("@")[0] || (preview ? "Preview account" : "Your account");

  useEffect(() => { if (details.current) details.current.open = false; }, [pathname]);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (details.current?.open && !details.current.contains(event.target as Node)) details.current.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.current?.open) {
        details.current.open = false;
        details.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", closeOnEscape); };
  }, []);

  async function signOut() {
    if (preview || signingOut) return;
    setSigningOut(true);
    setError("");
    try {
      const { error: signOutError } = await createBrowserSupabaseClient().auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      router.replace("/");
    } catch {
      setError("Sign out failed. Please try again.");
      setSigningOut(false);
    }
  }

  return <details className="account-menu" ref={details}>
    <summary className="account-trigger" aria-label={`Account menu for ${name}`}>
      <ProfileAvatar name={profile?.fullName ?? null} email={profile?.email ?? null} avatarPath={profile?.avatarPath ?? null} size={38} />
      <span className="account-trigger-copy"><strong>{name}</strong><small>{role} account</small></span>
      <ChevronDown size={15} aria-hidden="true" />
    </summary>
    <div className="account-popover">
      <div className="account-popover-identity"><strong>{name}</strong><span>{profile?.email ?? "Local design preview"}</span></div>
      <nav aria-label="Account navigation">
        <Link href="/dashboard/profile" onClick={() => { if (details.current) details.current.open = false; }}><UserRound size={17} /> My profile</Link>
        <Link href="/dashboard/profile#account-security" onClick={() => { if (details.current) details.current.open = false; }}><Settings2 size={17} /> Account &amp; security</Link>
      </nav>
      <button type="button" className="account-signout" onClick={signOut} disabled={preview || signingOut}><LogOut size={17} /> {preview ? "Sign out unavailable in preview" : signingOut ? "Signing out…" : "Sign out"}</button>
      {error && <p className="account-menu-error" role="alert">{error}</p>}
    </div>
  </details>;
}
