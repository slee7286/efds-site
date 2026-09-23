import Link from "next/link";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Search, MessagesSquare, Plus } from "lucide-react";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";
import { TicketCard } from "@/components/tickets/ticket-card";
import { getCurrentProfile } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import { getTicketWorkspace, ticketCounts } from "@/lib/db/tickets";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  if (profile && hasMinimumRole(profile.accessRole, "committee")) {
    const { tickets, timelines } = await getTicketWorkspace();
    const counts = ticketCounts(tickets);
    const mine = profile.officerId ? tickets.filter((ticket) => ticket.assignees.some((officer) => officer.id === profile.officerId) && ticket.status !== "completed" && ticket.status !== "cancelled") : [];
    const focus = (mine.length ? mine : tickets.filter((ticket) => ticket.status === "blocked" || ticket.status === "in_progress" || ticket.status === "open")).slice(0, 4);
    return <div className="app-content ticket-page"><div className="eyebrow">Committee workspace</div><div className="ticket-page-heading"><div><h1>What needs<br />doing next.</h1><p className="app-subtitle">A live view of committee work, assignments and progress.</p></div><Link className="button button-primary" href="/dashboard/tickets/new"><Plus size={16} /> New ticket</Link></div><section className="ticket-metrics" aria-label="Ticket overview"><div><span>Left to complete</span><strong>{counts.left}</strong><small>{counts.total} total tickets</small></div><div><span>In progress</span><strong>{counts.inProgress}</strong><small>Being worked on</small></div><div><span>Blocked</span><strong>{counts.blocked}</strong><small>Needs help</small></div><div><span>Completed</span><strong>{counts.completed}</strong><small>Finished work</small></div></section><div className="ticket-dashboard-focus"><div className="ticket-cluster-heading"><div><span>Where to focus</span><h2>{mine.length ? "Your active tickets" : "Active committee tickets"}</h2></div><Link href="/dashboard/tickets">All tickets <ArrowUpRight size={15} /></Link></div>{focus.length ? <div className="ticket-cluster-cards">{focus.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} timeline={timelines.get(ticket.id)} />)}</div> : <div className="empty-state"><h2>Nothing is waiting here.</h2><p>New committee tickets will appear as they are created or imported.</p></div>}</div></div>;
  }
  return <div className="app-content"><div className="eyebrow">Member workspace</div><h1>Welcome to your workspace.</h1><p className="app-subtitle">Society knowledge, resources and opportunities available to your account.</p><section className="workspace-welcome"><div><div className="eyebrow">Start with a search</div><h2>Find what<br /><em>you need.</em></h2><p>Search the society’s available sources, follow a reference or ask the EFDS assistant.</p><Link className="button button-paper" href="/dashboard/search">Search your workspace <ArrowUpRight size={16} /></Link></div><DisciplineGraphic type="data" /></section><section aria-label="Workspace shortcuts" className="workspace-shortcuts">{[
    { title: "Knowledge", text: "Explore the society guidance published for your access.", href: "/dashboard/knowledge", Icon: BookOpen },
    { title: "Search", text: "Find relevant information across your available sources.", href: "/dashboard/search", Icon: Search },
    { title: "Careers", text: "Find career resources and explore the available opportunities.", href: "/dashboard/careers", Icon: BriefcaseBusiness },
    { title: "Ask EFDS", text: "Ask a question and follow the evidence behind the answer.", href: "/dashboard/chat", Icon: MessagesSquare },
  ].map(({title,text,href,Icon}) => <Link className="surface workspace-shortcut" href={href} key={href}><Icon size={22} /><h2>{title}</h2><p>{text}</p><span>Explore <ArrowUpRight size={15} /></span></Link>)}</section><div className="surface workspace-note"><div><h2>Looking beyond the workspace?</h2><p>Explore society events and meet the people behind EFDS.</p></div><Link className="text-link" href="/events">See the society calendar <ArrowUpRight size={16} /></Link></div></div>;
}
