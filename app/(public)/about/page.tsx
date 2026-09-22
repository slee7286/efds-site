import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { JoinBanner } from "@/components/public/join-banner";
import { CampusPhotograph } from "@/components/public/campus-photograph";
import { society } from "@/lib/public-content";

export const metadata: Metadata = { title: "About", description: "Meet Imperial’s Economics, Finance & Data Science Society: a student community at the intersection of three disciplines." };
export default function AboutPage() {
  return <main id="main-content"><PageIntro eyebrow="About" title={<>About the<br />society.</>} description="EFDS is the departmental society for students on Imperial’s Economics, Finance and Data Science programme. A community built around the course, and the people on it." />
    <section className="section"><div className="container campus-spread"><CampusPhotograph /><div className="campus-story"><span className="editorial-label">South Kensington, London</span><h2>Three subjects.<br />One community.</h2><p><strong>EFDS stands for Economics, Finance &amp; Data Science Society.</strong> We are part of student life at Imperial Business School, organised by a student committee.</p><p>You might be interested in economic policy, quantitative research, a career in finance or simply meeting the people on your degree. The society is a place to start.</p><Link className="text-link" href="/committee">Meet the committee <ArrowUpRight size={16} /></Link></div></div></section>
    <section className="section section-tinted"><div className="container editorial-grid"><div><span className="editorial-label">Membership</span><h2>On the EFDS degree?<br />You’re already a member.</h2></div><div className="editorial-copy"><p>Imperial College Union states that students enrolled on the programme automatically become members of the society. The Union listing is the source for current membership and registration details.</p><p>Want to help organise an activity, suggest a topic or ask about getting involved? Start with the society’s official page.</p><a className="button button-primary" href={society.unionUrl} target="_blank" rel="noreferrer">EFDS at Imperial College Union <ArrowUpRight size={16} /></a></div></div></section>
    <section className="section-tight"><div className="container"><p className="editorial-note">EFDS Society is a student society at Imperial College London. This website is operated by the society and is not the official Imperial College London website.</p></div></section><JoinBanner />
  </main>;
}
