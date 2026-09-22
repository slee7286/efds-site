import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { CorrelationStudy } from "@/components/public/correlation-study";
export const metadata: Metadata = { title: "Research", description: "A space for EFDS member research, rigorous questions and ideas worth sharing." };
export default function ResearchPage() {
  return <main id="main-content"><PageIntro eyebrow="Research" title={<>Research<br />&amp; ideas.</>} description="A place for member papers, explainers and projects across the three subjects. To start, an interactive figure about one of the relationships that connects them." />
    <section className="section"><div className="container research-spread"><div><span className="editorial-label">An interactive note / 01</span><h2>What does correlation look like?</h2><p>Move the slider to change the linear relationship between two variables. A positive value means they tend to move together; a negative value means they tend to move in opposite directions.</p><p>Near zero, there is little linear association. That does not rule out another kind of relationship, and correlation alone does not establish cause and effect.</p><p className="research-method">The dots are simulated, standardised observations, with a sample correlation equal to the selected value. The dashed line is their linear regression. The outlines show the shape of the model, rather than confidence intervals.</p></div><CorrelationStudy /></div></section>
    <section className="section section-tinted"><div className="container editorial-empty"><span className="editorial-label">From our members</span><div><h2>No member research published yet.</h2><p>Have a paper, a data project or an explainer you would like to share? Send the committee a short description of the question, your method and your sources.</p></div><Link className="button button-outline" href="/contact">Share your work <ArrowUpRight size={16} /></Link></div></section>
  </main>;
}
