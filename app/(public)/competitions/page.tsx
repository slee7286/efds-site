import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
export const metadata: Metadata = { title: "Competitions", description: "Put your thinking into practice through teams, data and challenging questions." };
export default function CompetitionsPage() {
  return <main id="main-content"><PageIntro eyebrow="Competitions & challenges" title={<>A good problem.<br /><em>A great starting point.</em></>} description="Combine perspectives, work through uncertainty and make a case for your ideas. Competitions are a chance to discover what you can do together." graphic="data"><Link className="button button-primary" href="/events">Explore the calendar <ArrowUpRight size={16} /></Link></PageIntro>
    <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">Get ready to take part</div><h2>Different strengths.<br /><em>Better questions.</em></h2></div><p>No competitions are currently listed for registration here. Confirmed opportunities will appear in the society calendar.</p></div><div className="feature-grid">{[["01", "Find your team", "Look for complementary perspectives. A clear explanation, a sound model and good judgement all have a place."], ["02", "Work with the evidence", "Understand the problem before choosing a method. Document assumptions and make your work reproducible."], ["03", "Tell a convincing story", "Communicate the finding and its limits. The best answer is one other people can understand and challenge."]].map(([n,title,text]) => <article className="feature-card" key={n}><span className="feature-card-number">{n} /</span><h3>{title}</h3><p>{text}</p></article>)}</div><Link className="text-link" style={{ marginTop: 28 }} href="/contact">Have a challenge for the society? <ArrowUpRight size={16} /></Link></div></section>
  </main>;
}
