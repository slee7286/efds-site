import Link from "next/link";
import { ArrowUpRight, CalendarClock } from "lucide-react";
import type { Ticket } from "@/lib/db/tickets";

export const statusLabel: Record<Ticket["status"], string> = {
  open: "Open", in_progress: "In progress", blocked: "Blocked", completed: "Completed", cancelled: "Cancelled",
};

export function ticketDueLabel(ticket: Ticket) {
  if (ticket.dueAt) return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(ticket.dueAt));
  return ticket.dueText;
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const ownerLabel = ticket.assignees.length ? ticket.assignees.map((officer) => officer.name).join(", ") : ticket.ownerText || "Unassigned";
  return <Link className="ticket-card" href={`/dashboard/tickets/${ticket.id}`}>
    <span className="ticket-card-top"><span className={`ticket-status ticket-status-${ticket.status}`}>{statusLabel[ticket.status]}</span><span className="ticket-priority">{ticket.priority || "Medium"} priority</span></span>
    <strong>{ticket.title}</strong>
    <span className="ticket-card-bottom"><span>{ownerLabel}</span><ArrowUpRight size={16} aria-hidden="true" /></span>
    {ticketDueLabel(ticket) && <span className="ticket-due"><CalendarClock size={13} aria-hidden="true" /> {ticketDueLabel(ticket)}</span>}
  </Link>;
}
