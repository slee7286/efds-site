import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import { TicketCard } from "@/components/tickets/ticket-card";
import { SuggestionPanel } from "@/components/tickets/suggestion-panel";
import { getCurrentProfile } from "@/lib/auth/server";
import { getTicketWorkspace, ticketCounts, type Ticket } from "@/lib/db/tickets";

type Params = { q?: string; status?: string; view?: string; error?: string };

function clusters(tickets: Ticket[], view: "workstreams" | "people") {
  const groups = new Map<string, Ticket[]>();
  for (const ticket of tickets) {
    const names = view === "people" ? ticket.assignees.map((person) => person.name) : [ticket.workstream || "Unsorted"];
    for (const name of names.length ? names : [ticket.ownerText || "Unassigned"]) {
      groups.set(name, [...(groups.get(name) ?? []), ticket]);
    }
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export default async function TicketsPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const params = await searchParams ?? {};
  const [{ tickets, timelines, slackSyncedAt }, profile] = await Promise.all([getTicketWorkspace(), getCurrentProfile()]);
  const counts = ticketCounts(tickets);
  const suggestionCount = [...timelines.values()].filter((item) => item.suggestion).length;
  const view = params.view === "people" ? "people" : "workstreams";
  const q = (params.q ?? "").trim().toLowerCase().slice(0, 120);
  const status = ["open", "in_progress", "blocked", "completed", "cancelled"].includes(params.status ?? "") ? params.status : "";
  const shown = tickets.filter((ticket) => (!status || ticket.status === status) && (!q || [ticket.title, ticket.description, ticket.workstream, ticket.ownerText, ...ticket.assignees.map((officer) => officer.name)].filter(Boolean).join(" ").toLowerCase().includes(q)));
  return <div className="app-content ticket-page">
    <div className="eyebrow">Committee · work in progress</div>
    <div className="ticket-page-heading"><div><h1>The work,<br />in view.</h1><p className="app-subtitle">One place to see what is left, who owns it, and what needs attention.</p></div><Link className="button button-primary" href="/dashboard/tickets/new"><Plus size={16} /> New ticket</Link></div>
    <section className="ticket-metrics" aria-label="Ticket status">
      <div><span>Left to complete</span><strong>{counts.left}</strong><small>{counts.total} total tickets</small></div>
      <div><span>In progress</span><strong>{counts.inProgress}</strong><small>Being worked on</small></div>
      <div><span>Blocked</span><strong>{counts.blocked}</strong><small>Needs help</small></div>
      <div><span>Completed</span><strong>{counts.completed}</strong><small>Finished work</small></div>
    </section>
    {(counts.overdue > 0 || counts.unassigned > 0) && <p className="ticket-attention" role="status">{counts.overdue > 0 && `${counts.overdue} overdue`}{counts.overdue > 0 && counts.unassigned > 0 ? " · " : ""}{counts.unassigned > 0 && `${counts.unassigned} unassigned`}</p>}
    <div className="ticket-evidence-summary"><span>{suggestionCount} Slack progress {suggestionCount === 1 ? "suggestion" : "suggestions"} to review</span><span>{slackSyncedAt ? `Slack last synced ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(slackSyncedAt))}` : "Slack archive has not synced yet"}</span></div>
    {params.error && <p className="form-error" role="alert">The ticket could not be saved. Please try again.</p>}
    <div className="ticket-toolbar"><nav aria-label="Ticket views"><Link aria-current={view === "workstreams" ? "page" : undefined} href="/dashboard/tickets?view=workstreams">By workstream</Link><Link aria-current={view === "people" ? "page" : undefined} href="/dashboard/tickets?view=people">By person</Link></nav><form method="get"><input type="hidden" name="view" value={view} /><label className="sr-only" htmlFor="ticket-search">Search tickets</label><input id="ticket-search" className="input" type="search" name="q" placeholder="Search tickets or people" defaultValue={params.q ?? ""} /><label className="sr-only" htmlFor="ticket-status-filter">Ticket status</label><select id="ticket-status-filter" className="select" name="status" defaultValue={status}><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><button className="button button-quiet" type="submit"><Search size={15} /> Filter</button></form></div>
    {shown.length ? <section className="ticket-clusters" aria-label={view === "people" ? "Tickets grouped by person" : "Tickets grouped by workstream"}>{clusters(shown, view).map(([name, items]) => <section className="ticket-cluster" key={name}><div className="ticket-cluster-heading"><div><span>{view === "people" ? "Person" : "Workstream"}</span><h2>{name}</h2></div><strong>{items.length} {items.length === 1 ? "ticket" : "tickets"}</strong></div><div className="ticket-cluster-cards">{items.map((ticket) => <TicketCard ticket={ticket} timeline={timelines.get(ticket.id)} key={ticket.id} />)}</div></section>)}</section> : <div className="surface empty-state"><h2>{tickets.length ? "No tickets match those filters." : "No tickets have been added yet."}</h2><p>{tickets.length ? "Try another search or status." : "Create the first ticket to start tracking committee work."}</p><Link className="text-link" href={tickets.length ? "/dashboard/tickets" : "/dashboard/tickets/new"}>{tickets.length ? "Clear filters" : "Create a ticket"} <ArrowUpRight size={14} /></Link></div>}
    {profile?.accessRole === "admin" && <SuggestionPanel />}
  </div>;
}
