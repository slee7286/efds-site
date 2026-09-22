import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/public/brand";
import { society } from "@/lib/public-content";

const groups = [
  { title: "Discover", links: [["About the society", "/about"], ["Events", "/events"], ["Our committee", "/committee"], ["Competitions", "/competitions"]] },
  { title: "Go further", links: [["Careers", "/careers"], ["Research", "/research"], ["Resources", "/resources"], ["Ask EFDS", "/chat"]] },
  { title: "Connect", links: [["Get in touch", "/contact"], ["Work with us", "/partners"], ["Member workspace", "/login"]] },
];
export function SiteFooter() {
  return <footer className="public-footer"><div className="container"><div className="footer-top">
    <div className="footer-identity"><Brand /><p>The departmental society for Economics, Finance &amp; Data Science students at Imperial.</p><a href={society.unionUrl} target="_blank" rel="noreferrer">Find us at Imperial College Union <ArrowUpRight size={14} /></a></div>
    {groups.map(({ title, links }) => <div className="footer-group" key={title}><h2>{title}</h2><ul>{links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>)}
  </div><div className="footer-bottom"><p>© {new Date().getFullYear()} EFDS Society. Student-led at Imperial College London.</p><nav aria-label="Legal information"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/security">Security</Link></nav></div><p className="footer-disclaimer">An independent student society website. This is not the official Imperial College London website.</p></div></footer>;
}
