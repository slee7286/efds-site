import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";
import { JoinBanner } from "@/components/public/join-banner";
import { EventsEmptyState } from "@/components/public/events-empty-state";
import { EventCard } from "@/components/public/event-card";
import { getUpcomingEvents } from "@/lib/db/public";

const disciplines = [
  { number: "01", title: "Economics", type: "economics" as const, description: "Understand the choices, incentives and systems that shape our world.", href: "/research", link: "Follow a question" },
  { number: "02", title: "Finance", type: "finance" as const, description: "Connect the theory of markets with the people and decisions behind them.", href: "/careers", link: "Explore your direction" },
  { number: "03", title: "Data science", type: "data" as const, description: "Find the patterns. Test the assumptions. Turn evidence into understanding.", href: "/resources", link: "Build your toolkit" },
];

export default async function HomePage() {
  const events = await getUpcomingEvents();
  return <main id="main-content">
    <section className="home-hero">
      <div className="container home-hero-grid">
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-rule" />Student-led. Imperial-minded.</div>
          <h1>Think across<br /><em>boundaries.</em></h1>
          <p className="hero-description">Economics, finance and data science.<br />A shared curiosity. A different perspective.<br />Your community at Imperial College London.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/about">Discover the society <ArrowUpRight size={17} /></Link><Link className="button button-outline" href="/events">Explore events <ArrowRight size={16} /></Link></div>
          <div className="hero-note"><MapPin size={13} />South Kensington, London</div>
        </div>
        <figure className="hero-artwork" aria-label="A conceptual architectural study inspired by Imperial’s Queen’s Tower">
          <div className="hero-image-wrap"><Image src="/images/imperial-connections.webp" alt="Ivory architectural model inspired by Queen’s Tower, surrounded by a flowing blue mathematical surface and geometric forms" fill sizes="(max-width: 600px) 100vw, 50vw" preload /></div>
          <span className="hero-coordinate" aria-hidden="true">IMPERIAL / A DIFFERENT PERSPECTIVE</span>
          <figcaption className="artwork-label"><span><i />Studies in connection</span><span>Original conceptual artwork · 01</span></figcaption>
        </figure>
      </div>
    </section>
    <div className="discipline-strip"><div className="container discipline-strip-inner">{disciplines.map((d) => <div className="discipline-strip-item" key={d.title}><span>{d.number} /</span>{d.title}</div>)}<div className="discipline-strip-note">The Economics, Finance<br />&amp; Data Science Society</div></div></div>
    <section className="section"><div className="container">
      <div className="section-heading"><div><div className="eyebrow">The intersection is the interesting part</div><h2>Three disciplines.<br /><em>One bigger picture.</em></h2></div><p>Good questions rarely fit inside one subject. We’re a community for exploring what happens between them.</p></div>
      <div className="discipline-cards">{disciplines.map((d) => <article className="discipline-card" key={d.title}><div className="discipline-card-visual"><span className="eyebrow">FIELD / {d.number}</span><DisciplineGraphic type={d.type} /></div><div className="discipline-card-body"><h3>{d.title}</h3><p>{d.description}</p><Link className="text-link" href={d.href}>{d.link}<ArrowUpRight size={16} /></Link></div></article>)}</div>
    </div></section>
    <section className="section community-section"><div className="container community-grid">
      <div><div className="eyebrow">More than a course</div><h2>Serious curiosity.<br /><em>Shared generously.</em></h2><p>EFDS brings together the Economics, Finance and Data Science student community at Imperial. A place to exchange ideas, discover opportunities and find the people who make university yours.</p><Link className="button button-paper" href="/committee">Meet the people behind EFDS <ArrowUpRight size={16} /></Link></div>
      <div className="community-rows">{[
        ["01", "A place to connect", "Find your community through conversations, shared interests and society life.", "/about"],
        ["02", "A direction to explore", "Connect your academic interests with the work you might want to do.", "/careers"],
        ["03", "A question to pursue", "Bring your curiosity to research, competitions and practical learning.", "/competitions"],
      ].map(([n, title, description, href]) => <Link className="community-row" href={href} key={n}><span>{n}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight size={19} /></Link>)}</div>
    </div></section>
    <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">From ideas to conversations</div><h2>See what’s <em>next.</em></h2></div><Link className="text-link" href="/events">Events &amp; opportunities <ArrowUpRight size={16} /></Link></div>{events.length ? <div className="event-grid">{events.map((event) => <EventCard event={event} key={event.title} />)}</div> : <EventsEmptyState />}</div></section>
    <JoinBanner />
  </main>;
}
