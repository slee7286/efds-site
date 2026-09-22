import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
export const metadata: Metadata = { title: "Partners", description: "Start a conversation with EFDS about meaningful student engagement and collaboration." };
export default function PartnersPage() {
  return <main id="main-content"><PageIntro eyebrow="Partners" title={<>Work<br />with EFDS.</>} description="Introduce your work to students studying economics, finance and data science at Imperial. Talk to the committee about an activity or collaboration you have in mind."><Link className="button button-primary" href="/contact">Contact the society <ArrowUpRight size={16} /></Link></PageIntro>
    <section className="section"><div className="container editorial-grid"><div><span className="editorial-label">Possible formats</span><h2>Give students<br />something to work with.</h2><p className="editorial-copy">These are starting points for a discussion, rather than a published programme or sponsorship package.</p></div><dl className="format-list"><div><dt>A talk or discussion</dt><dd>Explain a problem from your field, how you approach it and what you have learned.</dd></div><div><dt>A practical workshop</dt><dd>Work through a method, tool or dataset, with a clear learning outcome for students.</dd></div><div><dt>A student challenge</dt><dd>Bring a well-defined question that a team can investigate and present back.</dd></div></dl></div></section>
    <section className="section section-tinted"><div className="container editorial-grid"><div><span className="editorial-label">What to include</span><h2>Make an introduction.</h2></div><div className="editorial-copy"><p>Tell the committee about your organisation, the activity you propose, your preferred timing and what students would take away from it.</p><p>Any collaboration is subject to agreement with the society and the relevant Imperial College Union processes.</p><Link className="text-link" href="/contact">Find the contact route <ArrowUpRight size={16} /></Link></div></div></section>
  </main>;
}
