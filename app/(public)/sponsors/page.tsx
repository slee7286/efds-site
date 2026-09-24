import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { SponsorRoster } from "@/components/public/sponsor-roster";

const contactEmail = "siheon.lee25@imperial.ac.uk";

export const metadata: Metadata = {
  title: "Sponsors",
  description: "Meet the founding partners and sponsor of the EFDS Society at Imperial College London.",
};

export default function SponsorsPage() {
  return <main id="main-content">
    <PageIntro eyebrow="Sponsors" title={<>Our<br />{" "}sponsors.</>} description={<>We’re always interested in new partnerships and sponsorships. To explore working with EFDS, <a className="sponsor-contact-link" href={`mailto:${contactEmail}`}>contact us</a>.</>} />

    <section className="section sponsor-page-section" aria-labelledby="sponsor-roster-heading"><div className="container">
      <div className="section-rule"><span>01 / With EFDS</span><span>Society sponsors</span></div>
      <div className="sponsor-page-heading"><h2 id="sponsor-roster-heading">Supporting what<br />students build.</h2><p>Our founding partners and sponsor support the Economics, Finance &amp; Data Science Society.</p></div>
      <SponsorRoster />
    </div></section>

    <section className="section section-tinted"><div className="container editorial-grid"><div><span className="editorial-label">A conversation to start</span><h2>Work with<br />the society.</h2></div><div className="editorial-copy"><p>If you have an idea for a talk, workshop or student challenge, tell us what you have in mind and what students would take away from it. Society collaborations follow the relevant Imperial College Union processes.</p><a className="text-link" href={`mailto:${contactEmail}`}>Email us about a partnership <ArrowUpRight size={16} /></a></div></div></section>
  </main>;
}
