import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";
export const metadata: Metadata = { title: "Research", description: "A space for EFDS member research, rigorous questions and ideas worth sharing." };
export default function ResearchPage() {
  return <main id="main-content"><PageIntro eyebrow="Research & ideas" title={<>Follow the question.<br /><em>See where it leads.</em></>} description="The most interesting ideas start with a little uncertainty. This is a space for thinking carefully, testing assumptions and making something clearer." />
    <section className="section"><div className="container"><div className="research-empty"><div><div className="eyebrow">The EFDS reading room</div><h2>A space for<br />your next insight.</h2><p>No member research has been published on this site yet. If you have a paper, an explainer or a question you would like to develop, get in touch with the society.</p><Link className="button button-dark" href="/contact">Share an idea <ArrowUpRight size={16} /></Link></div><DisciplineGraphic type="economics" /></div></div></section>
    <section className="section section-tinted"><div className="container"><div className="section-heading"><div><div className="eyebrow">A thoughtful contribution</div><h2>Make the complicated <em>clear.</em></h2></div></div><div className="feature-grid">{[["01", "A precise question", "Start with something you can investigate. Explain why the question matters and what an answer could change."], ["02", "Evidence you can follow", "Show your sources, explain the method and be honest about what the evidence can and cannot tell you."], ["03", "An idea others can use", "Write for a curious reader. Make the reasoning clear enough that someone from another discipline can join in."]].map(([n,title,text]) => <article className="feature-card" key={n}><span className="feature-card-number">{n} /</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
  </main>;
}
