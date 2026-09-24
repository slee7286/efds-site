import { TicketCard } from "@/components/tickets/ticket-card";
import type { Ticket } from "@/lib/db/tickets";
import type { TicketTimeline } from "@/lib/tickets/activity";

function clusters(tickets: Ticket[], view: "workstreams" | "people") {
  const groups = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    const names = view === "people" ? ticket.assignees.map((person) => person.name) : [ticket.workstream?.trim() || "Unsorted"];
    for (const name of names.length ? names : [ticket.ownerText || "Unassigned"]) {
      groups.set(name, [...(groups.get(name) ?? []), ticket]);
    }
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function TicketClusters({ tickets, view, timelines }: { tickets: Ticket[]; view: "workstreams" | "people"; timelines: Map<string, TicketTimeline> }) {
  return <section className="ticket-clusters" aria-label={view === "people" ? "Tickets grouped by person" : "Tickets grouped by workstream"}>{clusters(tickets, view).map(([name, items]) => {
    const active = items.filter((ticket) => ticket.status !== "completed");
    const completed = items.filter((ticket) => ticket.status === "completed");
    return <section className="ticket-cluster" key={name}><div className="ticket-cluster-heading"><div><span>{view === "people" ? "Person" : "Workstream"}</span><h2>{name}</h2></div><strong>{items.length} {items.length === 1 ? "ticket" : "tickets"}</strong></div>{active.length > 0 && <div className="ticket-cluster-cards">{active.map((ticket) => <TicketCard ticket={ticket} timeline={timelines.get(ticket.id)} key={ticket.id} />)}</div>}{completed.length > 0 && <details className="ticket-completed"><summary>{completed.length} completed {completed.length === 1 ? "ticket" : "tickets"}</summary><div className="ticket-cluster-cards">{completed.map((ticket) => <TicketCard ticket={ticket} timeline={timelines.get(ticket.id)} key={ticket.id} />)}</div></details>}</section>;
  })}</section>;
}
