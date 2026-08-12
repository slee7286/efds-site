import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description: "About the Economics, Finance & Data Science Society at Imperial College London.",
};

export default function AboutPage() {
  return <main>
    <section className="container page-intro"><div className="eyebrow">About EFDS</div><h1 className="display">Build a better lens.</h1><p>EFDS stands for Economics, Finance &amp; Data Science Society. We are an Imperial College London student society for people who want to understand the systems behind the numbers — and build the next version of them.</p><p className="page-note">EFDS Society is a student society at Imperial College London. This website is operated by the society and is not the official Imperial College London website.</p></section>
    <section className="section-tight"><div className="container content-grid"><article className="surface info-card"><div className="eyebrow">What we do</div><div className="article-body"><h2>Ideas need a place to travel.</h2><p>We connect economics, finance and data science through events, careers conversations, academic and research initiatives, competitions, and community activity. We run talks, workshops, socials and practical projects that make technical subjects feel human and useful.</p><p>Whether you are exploring your first model, investigating a research question, preparing for an assessment centre, or looking for people to build with, there is room to start where you are.</p><div className="tag-list"><span className="tag">Economics</span><span className="tag">Finance</span><span className="tag">Data science</span><span className="tag">Careers</span><span className="tag">Research</span><span className="tag">Competitions</span><span className="tag">Community</span></div></div></article><aside className="surface-dark info-card"><div className="eyebrow" style={{ color: "var(--mint)" }}>The website</div><div className="article-body"><h2 style={{ color: "var(--paper)" }}>Public signal, private workspace.</h2><p style={{ color: "rgba(247,247,243,.75)" }}>The public site shares society information, events and resources. Authenticated features support member workspaces, career planning and scoped chat. Committee and administrator areas support private operational work where applicable.</p><Link className="button button-primary" href="/events" style={{ marginTop: 26 }}>Find your next event</Link></div></aside></div></section>
  </main>;
}
