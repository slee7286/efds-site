import Link from "next/link";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import type { Ticket } from "@/lib/db/tickets";
import type { TicketTimeline } from "@/lib/tickets/activity";

export const statusLabel: Record<Ticket["status"], string> = {
  open: "Open", in_progress: "In progress", blocked: "Blocked", completed: "Completed", cancelled: "Cancelled",
};

export function ticketDueLabel(ticket: Ticket) {
  if (ticket.dueAt) return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(ticket.dueAt));
  return ticket.dueText;
}

export function TicketCard({ ticket, timeline }: { ticket: Ticket; timeline?: TicketTimeline }) {
  const ownerLabel = ticket.assignees.length ? ticket.assignees.map((officer) => officer.name).join(", ") : ticket.ownerText || "Unassigned";
  return <Link className="ticket-card" href={`/dashboard/tickets/${ticket.id}`}>
    <span className="ticket-card-top"><span className={`ticket-status ticket-status-${ticket.status}`}>{statusLabel[ticket.status]}</span><span className="ticket-priority">{ticket.priority || "Medium"} priority</span></span>
    <strong>{ticket.title}</strong>
    {timeline?.suggestion?.inferredStatus && <span className="ticket-signal">Slack suggests {statusLabel[timeline.suggestion.inferredStatus]}. Review evidence</span>}
    <span className="ticket-card-bottom"><span>{ownerLabel}</span><ArrowUpRight size={16} aria-hidden="true" /></span>
    {timeline?.latestUpdate && <span className="ticket-recent">Latest Slack update: {timeline.latestUpdate.actor} · {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }).format(new Date(timeline.latestUpdate.at))}</span>}
    {ticketDueLabel(ticket) && <span className="ticket-due"><CalendarClock size={13} aria-hidden="true" /> {ticketDueLabel(ticket)}</span>}
  </Link>;
}
