import Link from "next/link";
import { ArrowUpRight, Network, Plus, Search } from "lucide-react";
import { TicketClusters } from "@/components/tickets/ticket-clusters";
import { TicketGraph } from "@/components/tickets/ticket-graph";
import { SuggestionPanel } from "@/components/tickets/suggestion-panel";
import { getCurrentProfile } from "@/lib/auth/server";
import { getOutlookSyncStatus, getTicketWorkspace, ticketCounts } from "@/lib/db/tickets";

type Params = { q?: string; status?: string; view?: string; error?: string };

export default async function TicketsPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const params = await searchParams ?? {};
  const [{ tickets, officers, timelines, slackSyncedAt }, profile] = await Promise.all([getTicketWorkspace(), getCurrentProfile()]);
  const outlookSyncedAt = profile?.accessRole === "admin" ? await getOutlookSyncStatus() : null;
  const counts = ticketCounts(tickets);
  const personalTickets = profile?.accessRole === "committee" && profile.officerId
    ? tickets.filter((ticket) => ticket.assignees.some((assignee) => assignee.id === profile.officerId))
    : [];
  const suggestionCount = [...timelines.values()].filter((item) => item.suggestion).length;
  const view = params.view === "people" ? "people" : params.view === "workstreams" ? "workstreams" : "graph";
  const q = (params.q ?? "").trim().toLowerCase().slice(0, 120);
  const status = ["open", "in_progress", "blocked", "completed", "cancelled", "all"].includes(params.status ?? "") ? params.status : "";
  const showGroupedResults = view !== "graph" || status === "completed" || status === "cancelled";
  const shown = tickets.filter((ticket) => (status === "all" || !status || ticket.status === status) && (!q || [ticket.title, ticket.description, ticket.workstream, ticket.ownerText, ...ticket.assignees.map((officer) => officer.name)].filter(Boolean).join(" ").toLowerCase().includes(q)));
  const viewHref = (nextView: typeof view) => {
    const query = new URLSearchParams({ view: nextView });
    if (params.q?.trim()) query.set("q", params.q.trim().slice(0, 120));
    if (status) query.set("status", status);
    return `/dashboard/tickets?${query}`;
  };
  return <div className="app-content ticket-page">
    <div className="eyebrow">Committee · work in progress</div>
    <div className="ticket-page-heading"><div><h1>The work,<br />in view.</h1><p className="app-subtitle">One place to see what is left, who owns it, and what needs attention.</p></div><Link className="button button-primary" href="/dashboard/tickets/new"><Plus size={16} /> New ticket</Link></div>
    <section className="ticket-metrics" aria-label="Ticket status">
      <div><span>Left to complete</span><strong>{counts.left}</strong><small>{counts.total - tickets.filter((ticket) => ticket.status === "cancelled").length} current and completed</small></div>
      <div><span>In progress</span><strong>{counts.inProgress}</strong><small>Being worked on</small></div>
      <div><span>Blocked</span><strong>{counts.blocked}</strong><small>Needs help</small></div>
      <div><span>Completed</span><strong>{counts.completed}</strong><small>Finished work</small></div>
    </section>
    {(counts.overdue > 0 || counts.unassigned > 0) && <p className="ticket-attention" role="status">{counts.overdue > 0 && `${counts.overdue} overdue`}{counts.overdue > 0 && counts.unassigned > 0 ? " · " : ""}{counts.unassigned > 0 && `${counts.unassigned} unassigned`}</p>}
    <div className="ticket-evidence-summary"><span>{suggestionCount} Slack progress {suggestionCount === 1 ? "suggestion" : "suggestions"} to review</span><span>{slackSyncedAt ? `Slack last synced ${new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(slackSyncedAt))}` : "Slack archive has not synced yet"}</span></div>
    {params.error && <p className="form-error" role="alert">{params.error === "duplicate" ? "An open ticket with this title already exists. Review the graph before creating another." : params.error === "forbidden" ? "The cited source is no longer available to committee. Generate a new suggestion." : "The ticket could not be saved. Please check the fields and try again."}</p>}
    {profile?.accessRole === "committee" && <section className="ticket-personal-overview" aria-labelledby="personal-tickets-heading">
      <div className="ticket-personal-heading"><div><span className="eyebrow">Your queue</span><h2 id="personal-tickets-heading">Your assigned tickets</h2><p>Tickets assigned to your committee profile. Cancelled and completed tickets stay collapsed.</p></div><strong>{personalTickets.length} {personalTickets.length === 1 ? "ticket" : "tickets"}</strong></div>
      {personalTickets.length ? <TicketClusters tickets={personalTickets} view="workstreams" timelines={timelines} /> : <div className="ticket-personal-empty"><p>{profile.officerId ? "There are no tickets assigned to you yet." : "Your account is not linked to a committee roster profile, so assigned tickets cannot be matched. Contact an administrator."}</p></div>}
    </section>}
    <section className="ticket-team-overview" aria-labelledby="team-tickets-heading">
      <div className="ticket-team-heading"><span className="eyebrow">Committee-wide view</span><h2 id="team-tickets-heading">Everyone&apos;s tickets</h2><p>The full committee ticket board, including current work and collapsed history.</p></div>
      <div className="ticket-toolbar"><nav aria-label="Ticket views"><Link aria-current={view === "graph" ? "page" : undefined} href={viewHref("graph")}><Network size={15} aria-hidden="true" /> Graph</Link><Link aria-current={view === "workstreams" ? "page" : undefined} href={viewHref("workstreams")}>By workstream</Link><Link aria-current={view === "people" ? "page" : undefined} href={viewHref("people")}>By person</Link></nav><form method="get"><input type="hidden" name="view" value={view} /><label className="sr-only" htmlFor="ticket-search">Search tickets</label><input id="ticket-search" className="input" type="search" name="q" placeholder="Search tickets or people" defaultValue={params.q ?? ""} /><label className="sr-only" htmlFor="ticket-status-filter">Ticket status</label><select id="ticket-status-filter" className="select" name="status" defaultValue={status}><option value="">Current and completed; cancelled collapsed</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="cancelled">Archived (cancelled)</option><option value="all">All including archived</option></select><button className="button button-quiet" type="submit"><Search size={15} /> Filter</button></form></div>
      {shown.length > 0 && view === "graph" && showGroupedResults && <p className="ticket-archive-note">Completed and cancelled work stays out of the relationship graph. Expand a grouped section below to open these records.</p>}
      {shown.length ? showGroupedResults ? <TicketClusters tickets={shown} view={view === "people" ? "people" : "workstreams"} timelines={timelines} /> : <TicketGraph tickets={shown.map(({ id, title, workstream, status, priority, ownerText, assignees }) => ({ id, title, workstream, status, priority, ownerText, assignees }))} /> : <div className="surface empty-state"><h2>{tickets.length ? "No tickets match those filters." : "No tickets have been added yet."}</h2><p>{tickets.length ? "Try another search or status." : "Create the first ticket to start tracking committee work."}</p><Link className="text-link" href={tickets.length ? "/dashboard/tickets" : "/dashboard/tickets/new"}>{tickets.length ? "Clear filters" : "Create a ticket"} <ArrowUpRight size={14} /></Link></div>}
      <SuggestionPanel isAdmin={profile?.accessRole === "admin"} officers={officers} outlookSyncedAt={outlookSyncedAt} />
    </section>
  </div>;
}
