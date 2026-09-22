"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, CalendarDays, CircleHelp, Gauge, LayoutDashboard, Menu, Search, Settings, UserRound, X } from "lucide-react";
import { Brand } from "@/components/public/brand";
import type { AccessRole } from "@/types/domain";

const memberItems = [
  ["Dashboard", "/dashboard", LayoutDashboard], ["Search", "/dashboard/search", Search], ["Knowledge", "/dashboard/knowledge", BookOpen], ["Careers", "/dashboard/careers", BriefcaseBusiness], ["Jobs", "/dashboard/jobs", BriefcaseBusiness], ["Events", "/dashboard/events", CalendarDays], ["Ask EFDS", "/dashboard/chat", CircleHelp], ["Profile", "/dashboard/profile", UserRound],
] as const;
const adminItems = [["Overview", "/admin", Gauge], ["Search", "/admin/search", Search], ["Knowledge review", "/admin/knowledge", BookOpen], ["Document archive", "/admin/documents", BookOpen], ["Slack archive", "/admin/slack", BookOpen], ["Meeting archive", "/admin/meetings", CalendarDays], ["Operational truth", "/admin/operations", CalendarDays], ["Committee", "/admin/committee", UserRound], ["Integrations", "/admin/integrations", Settings]] as const;

export function AppSidebar({ role = "member", onNavigate }: { role?: AccessRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/dashboard" && href !== "/admin" && pathname.startsWith(`${href}/`));
  const items = memberItems.filter(([,href]) => href !== "/dashboard/knowledge" || ["member", "committee", "admin"].includes(role));
  return <aside className="app-sidebar" onClick={(event) => { if ((event.target as HTMLElement).closest("a")) onNavigate?.(); }}><Brand compact /><div className="sidebar-label">Your workspace</div><nav className="sidebar-nav" aria-label="Private navigation">{items.map(([label,href,Icon]) => <Link key={href} className={active(href) ? "active" : undefined} aria-current={active(href) ? "page" : undefined} href={href}><Icon size={16} />{label}</Link>)}</nav>{(role === "admin" || role === "committee") && <><div className="sidebar-label">Society operations</div><nav className="sidebar-nav" aria-label="Admin navigation">{adminItems.map(([label,href,Icon]) => <Link key={href} className={active(href) ? "active" : undefined} aria-current={active(href) ? "page" : undefined} href={href}><Icon size={16} />{label}</Link>)}</nav></>}<div className="sidebar-bottom sidebar-nav"><Link href="/"><ArrowUpRight size={16} />Back to public site</Link></div></aside>;
}

export function WorkspaceMenu({ role }: { role: AccessRole }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const current = dialog.current;
    current?.showModal();
    const button = trigger.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { current?.close(); document.body.style.overflow = previous; button?.focus(); };
  }, [open]);
  return <><button ref={trigger} className="menu-toggle" aria-label="Open workspace navigation" aria-controls="workspace-navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={21} /></button><dialog className="workspace-dialog" id="workspace-navigation" ref={dialog} aria-label="Workspace navigation" onCancel={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><div className="workspace-dialog-close"><button className="menu-toggle" aria-label="Close workspace navigation" onClick={() => setOpen(false)}><X size={21} /></button></div><AppSidebar role={role} onNavigate={() => setOpen(false)} /></dialog></>;
}
