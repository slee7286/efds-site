"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Brand } from "@/components/public/brand";
import { exploreNavigation, publicNavigation } from "@/lib/public-content";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
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
  return <header className="public-header">
    <div className="container public-header-inner"><Brand />
      <nav className="public-nav" aria-label="Main navigation">{publicNavigation.map(({ label, href }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav>
      <div className="header-actions"><Link className="header-chat" href="/chat">Ask EFDS <span aria-hidden="true">↗</span></Link><Link className="button button-dark header-login" href="/login">Member access <ArrowUpRight size={15} /></Link><button ref={trigger} className="menu-toggle" aria-label="Open navigation" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(true)}><Menu size={22} /></button></div>
    </div>
    <dialog ref={menu} className="mobile-menu" id="mobile-navigation" aria-label="Site navigation" onCancel={() => setOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="mobile-menu-top"><span className="eyebrow">Explore EFDS</span><button className="menu-toggle" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={24} /></button></div>
      <nav aria-label="Mobile navigation">{exploreNavigation.map(({ label, href }, index) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}><span className="mobile-menu-index">{String(index + 1).padStart(2, "0")}</span>{label}<ArrowUpRight size={18} /></Link>)}<Link className="button button-primary" href="/login" onClick={() => setOpen(false)}>Member access <ArrowUpRight size={16} /></Link></nav>
    </dialog>
  </header>;
}
