import Link from "next/link";
import { Search } from "lucide-react";
import { AppSidebar, WorkspaceMenu } from "@/components/dashboard/sidebar";
import { isSupabaseConfigured } from "@/lib/config";
import type { AccessRole } from "@/types/domain";

export function AppShell({ children, role = "member" }: { children: React.ReactNode; role?: AccessRole }) {
  const preview = !isSupabaseConfigured && process.env.NODE_ENV !== "production";
  return <div className="app-layout"><div className="app-frame"><AppSidebar role={role} /><main className="app-main" id="main-content"><div className="app-topbar"><WorkspaceMenu role={role} /><span className="breadcrumb">EFDS <span className="muted">/ {role === "admin" ? "Society operations" : "Your workspace"}</span></span><div className="profile-chip"><Link className="text-link" href={role === "admin" ? "/admin/search" : "/dashboard/search"} aria-label="Search workspace"><Search size={17} /></Link><span>{role} workspace</span><Link className="avatar" href="/dashboard/profile" aria-label="Your profile">EF</Link></div></div>{preview && <div className="preview-banner" role="note">Local design preview · Sample content only. Sign-in and connected services require configuration.</div>}{children}</main></div></div>;
}
