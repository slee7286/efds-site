import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { ActionToast } from "@/components/feedback/action-toast";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { AppSidebar, WorkspaceMenu } from "@/components/dashboard/sidebar";
import { isSupabaseConfigured } from "@/lib/config";
import type { AccessProfile, AccessRole } from "@/types/domain";

export function AppShell({ children, role = "member", profile = null }: { children: React.ReactNode; role?: AccessRole; profile?: AccessProfile | null }) {
  const preview = !isSupabaseConfigured && process.env.NODE_ENV !== "production";
  return <div className="app-layout"><div className="app-frame"><AppSidebar role={role} /><main className="app-main" id="main-content"><div className="app-topbar"><WorkspaceMenu role={role} /><span className="breadcrumb">EFDS <span className="muted">/ {role === "admin" || role === "committee" ? "Society operations" : "Your workspace"}</span></span><div className="profile-chip"><Link className="text-link" href={role === "admin" ? "/admin/search" : "/dashboard/search"} aria-label="Search workspace"><Search size={17} /></Link><AccountMenu profile={profile} role={role} preview={preview} /></div></div>{preview && <div className="preview-banner" role="note">Local design preview · Sample content only. Sign-in and connected services require configuration.</div>}{children}</main></div><Suspense fallback={null}><ActionToast /></Suspense></div>;
}
