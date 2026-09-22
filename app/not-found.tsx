import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";

export default function NotFound() {
  return <><SiteHeader /><main id="main-content" className="container route-feedback"><div className="route-feedback-content">
    <div className="eyebrow">404 · Page not found</div><h1>A different direction.</h1>
    <p>This page may have moved, or the link may be incomplete. There’s more to explore at EFDS.</p>
    <div className="route-feedback-actions"><Link className="button button-primary" href="/">Back to the homepage <ArrowRight size={16} /></Link><Link className="button button-quiet" href="/resources">Explore resources</Link></div>
  </div></main><SiteFooter /></>;
}
