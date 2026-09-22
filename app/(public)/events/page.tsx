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
  return <main id="main-content"><PageIntro eyebrow="Events" title={<>Events &amp;<br />society life.</>} description="Find confirmed society dates, details and registration links. This calendar will be updated when events are published." />
    <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">The calendar</div><h2>What’s coming up.</h2></div><p>Confirmed dates and details will appear here when they are published.</p></div>{events.length ? <div className="event-grid">{events.map(event => <EventCard event={event} key={event.title} />)}</div> : <EventsEmptyState />}</div></section>
    <section className="section section-tinted"><div className="container editorial-grid"><div><span className="editorial-label">Have something in mind?</span><h2>Suggest an event.</h2></div><div className="editorial-copy"><p>A speaker you would like to hear from, a workshop you could help run or an idea for bringing the course together: tell the committee what you have in mind.</p><Link className="text-link" href="/contact">Get in touch <ArrowUpRight size={16} /></Link></div></div></section>
  </main>;
}
