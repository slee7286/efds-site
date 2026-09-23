"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AccountMenu } from "@/components/dashboard/account-menu";
import { Brand } from "@/components/public/brand";
import { isSupabaseConfigured } from "@/lib/config";
import { exploreNavigation, publicNavigation } from "@/lib/public-content";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { AccessProfile } from "@/types/domain";

type PublicAccount = Pick<AccessProfile, "fullName" | "email" | "avatarPath" | "accessRole">;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [accountProfile, setAccountProfile] = useState<PublicAccount | null>(null);
  const signedIn = Boolean(userId);
  const menu = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createBrowserSupabaseClient();
    let active = true;
    let revision = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        revision += 1;
        if (active) setUserId(event === "SIGNED_OUT" ? null : session?.user?.id ?? null);
      }
    });
    const initialRevision = revision;
    void supabase.auth.getClaims().then(({ data, error }) => {
      if (active && revision === initialRevision) setUserId(!error && typeof data?.claims?.sub === "string" ? data.claims.sub : null);
    }).catch(() => {
      if (active && revision === initialRevision) setUserId(null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;
    let active = true;
    const supabase = createBrowserSupabaseClient();
    void (async () => {
      try {
        const { data } = await supabase.from("profiles").select("full_name,email,avatar_path,access_role").eq("auth_user_id", userId).maybeSingle();
        if (active) setAccountProfile(data ? {
          fullName: data.full_name,
          email: data.email,
          avatarPath: data.avatar_path,
          accessRole: data.access_role,
        } : null);
      } catch { if (active) setAccountProfile(null); }
    })();
    return () => { active = false; };
  }, [userId]);
  useEffect(() => {
    if (!open) return;
    const dialog = menu.current;
    dialog?.showModal();
    const button = trigger.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const media = window.matchMedia("(min-width: 1100px)");
    const closeOnDesktop = () => { if (media.matches) setOpen(false); };
    media.addEventListener("change", closeOnDesktop);
    return () => { dialog?.close(); document.body.style.overflow = previous; media.removeEventListener("change", closeOnDesktop); button?.focus(); };
  }, [open]);
  const accountHref = signedIn ? "/dashboard" : "/login";
  const accountLabel = signedIn ? "Workspace" : "Login";
  return <header className="public-header">
    <div className="container public-header-inner"><Brand />
      <nav className="public-nav" aria-label="Main navigation">{publicNavigation.map(({ label, href }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>
      <div className="header-actions"><Link className="header-chat" href="/chat">Ask EFDS <span aria-hidden="true">↗</span></Link><Link className="button button-dark header-login" href={accountHref}>{accountLabel} <ArrowUpRight size={15} /></Link>{signedIn && accountProfile && <div className="public-account"><AccountMenu profile={accountProfile} role={accountProfile.accessRole} preview={false} /></div>}<button ref={trigger} className="menu-toggle" aria-label="Open navigation" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(true)}><Menu size={22} /></button></div>
    </div>
    <dialog ref={menu} className="mobile-menu" id="mobile-navigation" aria-label="Site navigation" onCancel={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="mobile-menu-top"><span className="eyebrow">Explore EFDS</span><button className="menu-toggle" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={24} /></button></div>
      <nav aria-label="Mobile navigation">{exploreNavigation.map(({ label, href }, index) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}><span className="mobile-menu-index">{String(index + 1).padStart(2, "0")}</span>{label}<ArrowUpRight size={18} /></Link>)}<Link className="button button-primary" href={accountHref} onClick={() => setOpen(false)}>{accountLabel} <ArrowUpRight size={16} /></Link></nav>
    </dialog>
  </header>;
}
