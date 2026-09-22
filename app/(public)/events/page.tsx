import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { EventCard } from "@/components/public/event-card";
import { EventsEmptyState } from "@/components/public/events-empty-state";
import { getUpcomingEvents } from "@/lib/db/public";
export const metadata: Metadata = { title: "Events", description: "Conversations, connections and confirmed event information from Imperial’s EFDS Society." };
export default async function EventsPage() {
  const events = await getUpcomingEvents();
  return <main id="main-content"><PageIntro eyebrow="Events & community" title={<>Ideas are better<br /><em>in good company.</em></>} description="Step outside the lecture theatre. Find the conversations, people and perspectives that make your time at Imperial count." graphic="data" />
    <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">The calendar</div><h2>What’s coming up.</h2></div><p>Confirmed dates and details will appear here when they are published.</p></div>{events.length ? <div className="event-grid">{events.map(event => <EventCard event={event} key={event.title} />)}</div> : <EventsEmptyState />}</div></section>
    <section className="section section-tinted"><div className="container"><div className="section-heading"><div><div className="eyebrow">Follow your interests</div><h2>Where a conversation can lead.</h2></div></div><div className="feature-grid">{[["01", "People & perspectives", "Find out more about the students behind the society and the community we share.", "/committee", "Meet the committee"], ["02", "Industry & opportunity", "Explore the connection between the subjects you study and the work you could do.", "/careers", "Explore careers"], ["03", "Problems & possibilities", "Bring your curiosity to a practical challenge, a team or a research question.", "/competitions", "Explore competitions"]].map(([n,title,text,href,label]) => <article className="feature-card" key={n}><span className="feature-card-number">{n} /</span><h3>{title}</h3><p>{text}</p><Link className="text-link" href={href}>{label}<ArrowUpRight size={16} /></Link></article>)}</div></div></section>
  </main>;
}
