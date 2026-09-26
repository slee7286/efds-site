import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { dailyCareerExample, fixedCareerExamples, type CareerExample } from "@/lib/careers/daily-examples";
import { society } from "@/lib/public-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Careers", description: "Explore career directions across economics, finance, quantitative research, data and technology." };

const areas = [
  { title: "Finance", description: "Markets, capital and the decisions behind them. Explore investment, corporate finance and asset management.", examples: "finance" },
  { title: "Quantitative research", description: "Probability, programming and financial models. Investigate where analytical thinking meets markets.", examples: "quantitativeResearch" },
  { title: "Economics & policy", description: "From incentives to institutions. Explore research and decisions that shape economies and society.", examples: "economicsPolicy" },
  { title: "Data & AI", description: "Turn difficult questions into testable ideas through statistics, modelling and responsible use of data.", examples: null },
  { title: "Consulting", description: "Structure an unfamiliar problem, communicate the evidence and help people make a decision.", examples: "consulting" },
  { title: "Software & technology", description: "Build tools, systems and products that turn technical insight into something people can use.", examples: null },
] as const;

// Mirrors the reviewed brief structure in lib/careers/company-guide.ts. Kept as
// a local list so this public page never imports the member-only research data.
const demoTopics = [
  "What the company does",
  "Teams and structure",
  "What distinguishes its approach",
  "The work",
  "Direction and developments",
  "Risks and constraints",
  "Recruiting evidence",
] as const;

const demoFinding = {
  statement: "The firm sets out three business lines and names the UK entity that is regulated. It does not state which entity employs 2027 interns.",
  scope: "Group-level description from the firm’s own published disclosure.",
  source: "The firm’s own published disclosure · retrieved 25 September 2026",
} as const;

function examplesFor(area: typeof areas[number]["examples"], date: Date): CareerExample[] {
  if (area === "finance" || area === "consulting") return [dailyCareerExample(area, date)];
  if (area === "quantitativeResearch" || area === "economicsPolicy") return fixedCareerExamples[area];
  return [];
}

export default function CareersPage() {
  const today = new Date();
  return <main id="main-content"><PageIntro eyebrow="Careers" title="Careers." description="Economics, finance and data science open up several directions. Use this as a starting point, then go to Imperial’s Careers Service for current opportunities and individual support."><a className="button button-primary" href={society.careersUrl} target="_blank" rel="noopener noreferrer">Imperial Careers Service <ArrowUpRight size={16} /></a></PageIntro>
    <section className="section" id="career-areas"><div className="container"><div className="section-heading"><div><span className="editorial-label">Fields to explore</span><h2>Where could the degree take you?</h2></div><p>These firms illustrate career paths, not current vacancies or EFDS partnerships. The Finance and Consulting examples change each day in London.</p></div><div className="career-list">{areas.map((area, index) => {
      const examples = examplesFor(area.examples, today);
      return <article className="career-row" key={area.title}><span className="career-row-number">0{index + 1}</span><h3>{area.title}</h3><div className="career-row-body"><p>{area.description}</p><div className="career-row-examples">{examples.length > 0 ? <><span>{examples.length === 1 ? "Example firm" : "Example firms"}</span><div>{examples.map((firm) => <Link className="career-row-examples-guide" href={`/careers/guide/${firm.guideId}`} key={firm.guideId}>{firm.name} · Reviewed brief <ArrowUpRight size={13} aria-hidden="true" /></Link>)}</div></> : <Link className="career-row-examples-guide" href="/careers/guide">Browse public company briefs <ArrowUpRight size={13} aria-hidden="true" /></Link>}</div></div><a className="career-row-explore" href={society.careersUrl} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${area.title} with Imperial Careers Service (opens in new tab)`}><ArrowUpRight size={20} aria-hidden="true" /></a></article>;
    })}</div></div></section>
    <section className="section section-tinted"><div className="container editorial-grid"><div><span className="editorial-label">Before you apply</span><h2>Know the company.<br />Check the role.</h2></div><div className="editorial-copy"><p>The reviewed briefs for the firms featured here are open to everyone. The full company research library is available to verified students enrolled on Imperial’s BSc Economics, Finance and Data Science.</p><Link className="text-link" href="/careers/guide">Explore the public company guide <ArrowUpRight size={16} /></Link><p>The guide is a research snapshot, not a live vacancy board. Check each employer’s current listing for deadlines and eligibility. For individual guidance, use Imperial’s Careers Service.</p><Link className="text-link" href="/resources">Open the resource directory <ArrowUpRight size={16} /></Link></div></div>
      <div className="container career-guide-demo">
        <div className="career-guide-demo-head"><span className="editorial-label">Inside the guide</span><h3>Every brief is sourced and scoped.</h3><p>Each reviewed company brief covers the same seven topics, and every statement carries the source it came from and the scope it applies to. Nothing is published without a citation a student can open.</p></div>
        <ul className="career-guide-demo-topics" aria-label="Topics covered in every company brief">{demoTopics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
        <figure className="career-guide-demo-card"><span className="career-guide-demo-tag">Illustrative example</span><p className="career-guide-demo-statement">“{demoFinding.statement}”</p><p className="career-guide-demo-scope">Scope: {demoFinding.scope}</p><span className="career-guide-demo-source">Source: {demoFinding.source}</span></figure>
        <p className="career-guide-demo-note">The example above shows the shape of a finding, not a real brief. The featured company briefs are public; the full library is reserved for verified EFDS students.</p>
      </div>
    </section>
  </main>;
}
