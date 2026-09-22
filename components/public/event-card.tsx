import { CalendarDays } from "lucide-react";
import type { PublicEvent } from "@/types/domain";

export function EventCard({ event }: { event: PublicEvent }) {
  return (
    <article className={`event-card ${event.accent}`}>
      <div className="event-date"><CalendarDays size={13} /> {event.date} · {event.type}</div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
    </article>
  );
}
