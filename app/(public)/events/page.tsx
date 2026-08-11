import { EventCard } from "@/components/public/event-card";
import { getUpcomingEvents } from "@/lib/db/public";

export default async function EventsPage() { const events = await getUpcomingEvents(); return <main><section className="container page-intro"><div className="eyebrow">Events &amp; programmes</div><h1 className="display">Put the theory<br />in a room.</h1><p>Conversations, workshops and competitions for people who like their ideas tested in public.</p></section><section className="section-tight"><div className="container"><div className="event-grid">{events.map((event) => <EventCard event={event} key={event.title} />)}</div></div></section></main>; }
