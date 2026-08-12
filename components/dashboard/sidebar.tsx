import Link from "next/link";
import { BookOpen, BriefcaseBusiness, CalendarDays, CircleHelp, Gauge, LayoutDashboard, LogOut, Settings, Shield, UserRound } from "lucide-react";
import type { AccessRole } from "@/types/domain";

const memberItems = [
  ["Dashboard", "/dashboard", LayoutDashboard], ["Knowledge", "/dashboard/knowledge", BookOpen], ["Careers", "/dashboard/careers", BriefcaseBusiness], ["Jobs", "/dashboard/jobs", BriefcaseBusiness], ["Events", "/dashboard/events", CalendarDays], ["Ask EFDS", "/dashboard/chat", CircleHelp], ["Profile", "/dashboard/profile", UserRound],
] as const;

const adminItems = [["Overview", "/admin", Gauge], ["Knowledge review", "/admin/knowledge", BookOpen], ["Committee", "/admin/committee", UserRound], ["Actions", "/admin/actions", CalendarDays], ["Integrations", "/admin/integrations", Settings]] as const;

export function AppSidebar({ role = "member" }: { role?: AccessRole }) {
  const visibleMemberItems = memberItems.filter(([, href]) => href !== "/dashboard/knowledge" || role === "committee" || role === "admin");
  return (
    <aside className="app-sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark">EFDS</span>
        <span className="brand-copy">EFDS platform<small>Private workspace</small></span>
      </Link>
      <div className="sidebar-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Private navigation">
        {visibleMemberItems.map(([label, href, Icon]) => <Link key={href} className={href === "/dashboard" ? "active" : ""} href={href}><Icon size={15} />{label}</Link>)}
      </nav>
      {(role === "admin" || role === "committee") && <>
        <div className="sidebar-label">Operations</div>
        <nav className="sidebar-nav" aria-label="Admin navigation">
          {adminItems.map(([label, href, Icon]) => <Link key={href} href={href}><Icon size={15} />{label}</Link>)}
        </nav>
      </>}
      <div className="sidebar-bottom sidebar-nav">
        <Link href="/"><LogOut size={15} />Leave workspace</Link>
      </div>
    </aside>
  );
}
