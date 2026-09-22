import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { society } from "@/lib/public-content";
export const metadata: Metadata = { title: "Contact", description: "Contact routes for EFDS Society members, collaborators and account enquiries." };
export default function ContactPage() {
  return <main id="main-content"><PageIntro eyebrow="Get in touch" title={<>Find the right<br /><em>route in.</em></>} description="A question, an idea or a conversation worth having? Start with the society’s official Imperial College Union page." graphic="data" />
    <section className="section"><div className="container editorial-grid"><div><div className="eyebrow">Your first stop</div><h2>EFDS at<br />Imperial College Union.</h2><p className="editorial-copy" style={{ marginTop: 24 }}>Find the right route in. Our Union listing holds current society information, membership and registration options.</p><a className="button button-primary" href={society.unionUrl} target="_blank" rel="noreferrer">Open the EFDS Union page <ArrowUpRight size={17} /></a></div><div className="career-list">{[["01", "Joining & society life", "Ask about membership, getting involved or attending society activities."], ["02", "Collaborations & ideas", "Introduce your organisation or idea, the proposed timing and what you would like to explore together."], ["03", "Accounts & support", "Describe the page and what happened. Keep passwords and sign-in links private."], ["04", "Privacy & security", "Tell the society about your request or concern. Include the affected page, without sharing private data."]].map(([n,title,text]) => <div className="contact-row" key={n}><span className="feature-card-number">{n} /</span><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div></section>
    <section className="section-tight section-tinted"><div className="container"><p className="editorial-note">For information about your data and account access, read our <Link href="/privacy">privacy information</Link> and <Link href="/security">security information</Link>.</p></div></section>
  </main>;
}
