import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { SubmitButton } from "@/components/feedback/submit-button";
import { statusLabel, ticketDueLabel } from "@/components/tickets/ticket-card";
import { ticketAction } from "@/lib/actions/tickets";
import { getTicketWorkspace } from "@/lib/db/tickets";

const errors: Record<string, string> = {
  invalid: "Check the details and try again.", conflict: "This ticket changed while you were editing. Review the latest version before saving.",
  forbidden: "You do not have permission to change this ticket.", save_failed: "The ticket could not be saved. Please try again.",
};

export default async function TicketDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const query: { error?: string; saved?: string } = await searchParams ?? {};
  const { tickets, officers } = await getTicketWorkspace();
  const ticket = tickets.find((item) => item.id === id);
  if (!ticket) notFound();
  const hidden = <><input type="hidden" name="ticketId" value={ticket.id} /><input type="hidden" name="expectedVersion" value={ticket.reviewVersion} /></>;
  return <div className="app-content ticket-page"><Link className="ticket-back" href="/dashboard/tickets"><ArrowLeft size={15} /> All tickets</Link><div className="eyebrow">{ticket.workstream || "Committee work"} · ticket</div><h1>{ticket.title}</h1><div className="ticket-detail-meta"><span className={`ticket-status ticket-status-${ticket.status}`}>{statusLabel[ticket.status]}</span><span>{ticket.priority || "Medium"} priority</span><span>{ticketDueLabel(ticket) ? `Due ${ticketDueLabel(ticket)}` : "No due date"}</span></div>
    {query.error && <p className="form-error" role="alert">{errors[query.error] || errors.save_failed}</p>}
    {query.saved && <p className="form-success" role="status">Ticket saved.</p>}
    <div className="ticket-detail-grid"><div><section className="surface info-card ticket-description"><h2>What needs to happen</h2><p>{ticket.description || "No description has been added yet."}</p>{ticket.sourceMessageId && <Link className="text-link" href={`/dashboard/slack/messages/${ticket.sourceMessageId}`}>See the source Slack ticket <ArrowUpRight size={14} /></Link>}</section>
      <form className="surface info-card ticket-form" action={ticketAction}><input type="hidden" name="action" value="update" />{hidden}<h2>Edit ticket</h2><label className="form-label">Title<input className="input" name="title" required maxLength={300} defaultValue={ticket.title} /></label><label className="form-label">Description<textarea className="textarea" name="description" rows={5} maxLength={5000} defaultValue={ticket.description ?? ""} /></label><div className="ticket-form-grid"><label className="form-label">Workstream<input className="input" name="workstream" maxLength={100} defaultValue={ticket.workstream ?? ""} /></label><label className="form-label">Priority<select className="select" name="priority" defaultValue={ticket.priority || "medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="form-label">Due date<input className="input" type="date" name="dueDate" defaultValue={ticket.dueAt?.slice(0, 10) ?? ""} /></label></div><SubmitButton className="button button-primary" type="submit">Save details</SubmitButton></form></div>
      <aside><form className="surface info-card ticket-side-form" action={ticketAction}><input type="hidden" name="action" value="status" />{hidden}<h2>Status</h2><p>Make the current state visible to the whole committee.</p><label className="form-label">Current state<select className="select" name="status" defaultValue={ticket.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><SubmitButton className="button button-dark" type="submit">Update status</SubmitButton></form>
        <form className="surface info-card ticket-side-form" action={ticketAction}><input type="hidden" name="action" value="assign" />{hidden}<h2>People</h2><p>{ticket.ownerText ? `Original assignment: ${ticket.ownerText}` : "Choose the people responsible for this ticket."}</p><fieldset className="ticket-assignees"><legend className="sr-only">Assign committee members</legend><div>{officers.map((officer) => <label key={officer.id}><input type="checkbox" name="assigneeIds" value={officer.id} defaultChecked={ticket.assignees.some((assigned) => assigned.id === officer.id)} /><span><strong>{officer.name}</strong><small>{officer.role}</small></span></label>)}</div></fieldset><SubmitButton className="button button-dark" type="submit">Save assignments</SubmitButton></form><div className="ticket-updated"><Clock3 size={14} /> Updated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ticket.updatedAt))}</div></aside></div>
  </div>;
}
