import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
export const metadata: Metadata = { title: "Competitions", description: "Put your thinking into practice through teams, data and challenging questions." };
export default function CompetitionsPage() {
  return <main id="main-content"><PageIntro eyebrow="Competitions" title="Competitions." description="Find a team, work with data and put your ideas to the test. Confirmed society competition opportunities will be listed here when available." />
    <section className="section"><div className="container editorial-empty"><span className="editorial-label">Registration</span><div><h2>No competitions currently listed.</h2><p>There are no competition registrations published on this site. Check the society calendar for confirmed activities, or contact the committee with an opportunity.</p></div><Link className="button button-outline" href="/events">Society calendar <ArrowUpRight size={16} /></Link></div></section>
    <section className="section section-tinted"><div className="container editorial-grid"><div><span className="editorial-label">Preparing a team</span><h2>Before the brief.</h2><Link className="text-link" href="/contact">Suggest a competition <ArrowUpRight size={16} /></Link></div><ol className="preparation-list"><li><h3>Read the entry requirements.</h3><p>Check the organiser’s eligibility rules, team size, dates and submission format before committing.</p></li><li><h3>Agree how you will work.</h3><p>Divide the research, modelling and presentation work. Keep a shared record of your data sources and assumptions.</p></li><li><h3>Leave time to check the result.</h3><p>Reproduce the analysis, test the explanation and be clear about the limits of your answer.</p></li></ol></div></section>
  </main>;
}
