import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="public-header">
      <div className="container public-header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">EFDS</span>
          <span className="brand-copy">Economics, Finance<br /><small>&amp; Data Science Society</small></span>
        </Link>
        <nav className="public-nav" aria-label="Public navigation">
          <Link href="/about">About</Link>
          <Link href="/events">Events</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/research">Research</Link>
          <Link href="/resources">Resources</Link>
          <Link href="/chat">Ask EFDS <ArrowUpRight size={12} /></Link>
          <Link className="button button-dark" href="/login">Member login <ArrowUpRight size={13} /></Link>
        </nav>
        <Link className="mobile-nav button button-outline" href="/login" aria-label="Open member login"><Menu size={17} /></Link>
      </div>
    </header>
  );
}
