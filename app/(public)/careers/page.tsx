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
      return <article className="career-row" key={area.title}><span className="career-row-number">0{index + 1}</span><h3>{area.title}</h3><div className="career-row-body"><p>{area.description}</p>{examples.length > 0 && <div className="career-row-examples"><span>{examples.length === 1 ? "Example firm" : "Example firms"}</span><div>{examples.map((firm) => <a key={firm.name} href={firm.url} target="_blank" rel="noopener noreferrer" aria-label={`${firm.name} official site (opens in new tab)`}>{firm.name}<ArrowUpRight size={13} aria-hidden="true" /></a>)}</div></div>}</div><a className="career-row-explore" href={society.careersUrl} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${area.title} with Imperial Careers Service (opens in new tab)`}><ArrowUpRight size={20} aria-hidden="true" /></a></article>;
    })}</div></div></section>
    <section className="section section-tinted"><div className="container editorial-grid"><div><span className="editorial-label">Before you apply</span><h2>Know the company.<br />Check the role.</h2></div><div className="editorial-copy"><p>Our sourced company research guide is available only to verified students enrolled on Imperial’s BSc Economics, Finance and Data Science. It is not available to non-EFDS students, even if they hold EFDS Union society membership.</p><Link className="text-link" href="/dashboard/careers/guide">Explore the student company guide <ArrowUpRight size={16} /></Link><p>The guide is a research snapshot, not a live vacancy board. Check each employer’s current listing for deadlines and eligibility. For individual guidance, use Imperial’s Careers Service.</p><Link className="text-link" href="/resources">Open the resource directory <ArrowUpRight size={16} /></Link></div></div></section>
  </main>;
}
