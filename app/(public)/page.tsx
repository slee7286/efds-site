import Link from "next/link";
import { ArrowUpRight, ArrowDown, ArrowRight } from "lucide-react";
import { CorrelationStudy } from "@/components/public/correlation-study";
import { CampusPhotograph } from "@/components/public/campus-photograph";
import { JoinBanner } from "@/components/public/join-banner";
import { SponsorRoster } from "@/components/public/sponsor-roster";
import { society } from "@/lib/public-content";
import { getUpcomingEvents } from "@/lib/db/public";

export default async function HomePage() {
  const [nextEvent] = await getUpcomingEvents();
  return <main id="main-content">
    <section className="editorial-hero">
      <div className="container hero-dateline"><span>Imperial College London</span><span>Student society / South Kensington</span></div>
      <div className="container editorial-hero-grid">
        <div className="editorial-hero-copy"><h1>Economics.<br />Finance.<br /><span>Data science.</span></h1><div className="hero-introduction"><span className="hero-margin-mark" aria-hidden="true">↳</span><div><p>The student society for the EFDS degree at Imperial. Find your community, explore your interests and get involved beyond the course.</p><div className="hero-actions"><a className="button button-primary" href={society.unionUrl} target="_blank" rel="noreferrer">Join the society <ArrowUpRight size={17} /></a><Link className="text-link" href="/about">About EFDS <ArrowRight size={16} /></Link></div></div></div></div>
        <CorrelationStudy />
      </div>
      <div className="container hero-endnote"><a href="#society">There’s more to your degree <ArrowDown size={14} /></a><span>People, ideas &amp; a healthy respect for the evidence.</span></div>
    </section>

    <section className="campus-section container" id="society">
      <div className="section-rule"><span>01 / The society</span><span>Made at Imperial</span></div>
      <div className="campus-spread"><CampusPhotograph /><div className="campus-story"><span className="editorial-label">Our corner of London</span><h2>Your degree<br />has a society.</h2><p>EFDS is the departmental society for Imperial’s Economics, Finance and Data Science students. If you’re enrolled on the programme, you’re already a member.</p><p>This is a place to meet the people on your course, find useful information and help shape society life.</p><Link className="text-link" href="/committee">Meet your committee <ArrowUpRight size={16} /></Link><a className="small-source" href={society.unionUrl} target="_blank" rel="noreferrer">Membership information: Imperial College Union ↗</a></div></div>
    </section>

    <section className="society-index container">
      <div className="section-rule"><span>02 / Explore EFDS</span><span>Start here</span></div>
      <div className="index-layout"><div className="index-heading"><h2>Outside the<br />timetable.</h2><p>A few directions you can take it.</p><Link className="text-link" href="/resources">The resource directory <ArrowUpRight size={16} /></Link></div><div className="index-entries">{[
        ["01", "Events", "Society dates, registration and the people organising it all.", "/events"],
        ["02", "Careers", "Explore fields, find Imperial’s careers support and plan your next step.", "/careers"],
        ["03", "Research", "Bring a question, develop an argument and share your work.", "/research"],
        ["04", "Competitions", "Put a team together and work through a problem that interests you.", "/competitions"],
      ].map(([number,title,description,href]) => <Link href={href} className="index-entry" key={number}><span className="entry-number">{number}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight size={24} /></Link>)}</div></div>
    </section>

    <section className="notice-section"><div className="container notice-grid"><div className="notice-title"><span className="editorial-label">Society noticeboard</span><h2>What’s on?</h2></div>{nextEvent ? <div><h3>{nextEvent.title}</h3><p>{nextEvent.date} · {nextEvent.type}</p><p>{nextEvent.description}</p></div> : <div><h3>No confirmed dates yet.</h3><p>There are no confirmed events published here yet. Check the society’s Union page for current information and registration options.</p></div>}<Link className="button button-dark" href="/events">See the calendar <ArrowUpRight size={17} /></Link></div></section>

    <section className="sponsor-home container" aria-labelledby="home-sponsors-heading">
      <div className="section-rule"><span>03 / Sponsors</span><span>With EFDS</span></div>
      <div className="sponsor-home-layout"><div className="sponsor-home-intro"><span className="editorial-label">The organisations with us</span><h2 id="home-sponsors-heading">Our<br />{" "}sponsors.</h2><p>Meet the founding partners and sponsor supporting the EFDS Society.</p><Link className="text-link" href="/sponsors">Meet our sponsors <ArrowUpRight size={16} /></Link></div><SponsorRoster /></div>
    </section>

    <JoinBanner />
  </main>;
}
