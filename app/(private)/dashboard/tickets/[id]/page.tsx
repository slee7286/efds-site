import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Clock3 } from "lucide-react";
import { SubmitButton } from "@/components/feedback/submit-button";
import { TicketActivityLog } from "@/components/tickets/ticket-activity";
import { statusLabel, ticketDueLabel } from "@/components/tickets/ticket-card";
import { remindTicketAssignees, ticketAction } from "@/lib/actions/tickets";
import { getTicketWorkspace } from "@/lib/db/tickets";

const errors: Record<string, string> = {
  invalid: "Check the details and try again.", conflict: "This ticket changed while you were editing. Review the latest version before saving.",
  forbidden: "You do not have permission to change this ticket.", save_failed: "The ticket could not be saved. Please try again.",
};
const reminderErrors: Record<string, string> = {
  invalid: "Refresh the ticket and try again.",
  unavailable: "Email reminders are unavailable right now.",
  conflict: "This ticket changed. Review the latest assignments before reminding people.",
  recent: "A reminder was requested for this ticket within the last minute.",
  no_recipients: "No assigned officer has an active linked committee account with an email address.",
  forbidden: "You do not have permission to send a reminder for this ticket.",
  send_failed: "The reminder could not be queued. Please try again.",
};

export default async function TicketDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ error?: string; saved?: string; reminderError?: string; reminded?: string }> }) {
  const { id } = await params;
  const query = await searchParams ?? {};
  const { tickets, officers, timelines, slackSyncedAt } = await getTicketWorkspace();
  const ticket = tickets.find((item) => item.id === id);
  if (!ticket) notFound();
  const reminded = /^[1-9]\d?$/.test(query.reminded ?? "") ? Number(query.reminded) : 0;
  const timeline = timelines.get(ticket.id);
  const hidden = <><input type="hidden" name="ticketId" value={ticket.id} /><input type="hidden" name="expectedVersion" value={ticket.reviewVersion} /></>;
  return <div className="app-content ticket-page"><Link className="ticket-back" href="/dashboard/tickets"><ArrowLeft size={15} /> All tickets</Link><div className="eyebrow">{ticket.workstream || "Committee work"} · ticket</div><h1>{ticket.title}</h1><div className="ticket-detail-meta"><span className={`ticket-status ticket-status-${ticket.status}`}>{statusLabel[ticket.status]}</span><span>{ticket.priority || "Medium"} priority</span><span>{ticketDueLabel(ticket) ? `Due ${ticketDueLabel(ticket)}` : "No due date"}</span></div>
    {query.error && <p className="form-error" role="alert">{errors[query.error] || errors.save_failed}</p>}
    {query.saved && <p className="form-success" role="status">Ticket saved.</p>}
    {query.reminderError && <p className="form-error" role="alert">{reminderErrors[query.reminderError] || reminderErrors.send_failed}</p>}
    {reminded > 0 && <p className="form-success" role="status">Reminder {reminded === 1 ? "email" : "emails"} queued for {reminded} linked {reminded === 1 ? "account" : "accounts"}.</p>}
    {timeline?.suggestion?.inferredStatus && <section className="ticket-progress-suggestion" aria-label="Slack progress suggestion"><div><span className="eyebrow">Review Slack evidence</span><h2>Slack suggests {statusLabel[timeline.suggestion.inferredStatus]}</h2><p>{timeline.suggestion.actor} · {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(timeline.suggestion.at))}{timeline.suggestion.observedOnly ? " · reaction first seen by archive" : ""}. The official status stays {statusLabel[ticket.status].toLowerCase()} until a committee member confirms it.</p>{timeline.suggestion.sourceMessageId && <Link href={`/dashboard/slack/messages/${timeline.suggestion.sourceMessageId}`}>Review source <ArrowUpRight size={14} /></Link>}</div><form action={ticketAction}><input type="hidden" name="action" value="status" />{hidden}<input type="hidden" name="status" value={timeline.suggestion.inferredStatus} /><SubmitButton className="button button-primary" type="submit">Confirm {statusLabel[timeline.suggestion.inferredStatus].toLowerCase()}</SubmitButton></form></section>}
    <div className="ticket-detail-grid"><div><section className="surface info-card ticket-description"><h2>What needs to happen</h2><p>{ticket.description || "No description has been added yet."}</p>{ticket.sourceMessageId && <Link className="text-link" href={`/dashboard/slack/messages/${ticket.sourceMessageId}`}>See the source Slack ticket <ArrowUpRight size={14} /></Link>}</section>
      <TicketActivityLog timeline={timeline} syncedAt={slackSyncedAt} />
      <form className="surface info-card ticket-form" action={ticketAction}><input type="hidden" name="action" value="update" />{hidden}<h2>Edit ticket</h2><label className="form-label">Title<input className="input" name="title" required maxLength={300} defaultValue={ticket.title} /></label><label className="form-label">Description<textarea className="textarea" name="description" rows={5} maxLength={5000} defaultValue={ticket.description ?? ""} /></label><div className="ticket-form-grid"><label className="form-label">Workstream<input className="input" name="workstream" maxLength={100} defaultValue={ticket.workstream ?? ""} /></label><label className="form-label">Priority<select className="select" name="priority" defaultValue={ticket.priority || "medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="form-label">Due date<input className="input" type="date" name="dueDate" defaultValue={ticket.dueAt?.slice(0, 10) ?? ""} /></label></div><SubmitButton className="button button-primary" type="submit">Save details</SubmitButton></form></div>
      <aside><form className="surface info-card ticket-side-form" action={ticketAction}><input type="hidden" name="action" value="status" />{hidden}<h2>Status</h2><p>Make the current state visible to the whole committee.</p><label className="form-label">Current state<select className="select" name="status" defaultValue={ticket.status}><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label><SubmitButton className="button button-dark" type="submit">Update status</SubmitButton></form>
        <form className="surface info-card ticket-side-form" action={ticketAction}><input type="hidden" name="action" value="assign" />{hidden}<h2>People</h2><p>{ticket.ownerText ? `Original assignment: ${ticket.ownerText}` : "Choose the people responsible for this ticket."}</p><fieldset className="ticket-assignees"><legend className="sr-only">Assign committee members</legend><div>{officers.map((officer) => <label key={officer.id}><input type="checkbox" name="assigneeIds" value={officer.id} defaultChecked={ticket.assignees.some((assigned) => assigned.id === officer.id)} /><span><strong>{officer.name}</strong><small>{officer.role}</small></span></label>)}</div></fieldset><SubmitButton className="button button-dark" type="submit">Save assignments</SubmitButton></form>
        <form className="surface info-card ticket-side-form" action={remindTicketAssignees}><input type="hidden" name="ticketId" value={ticket.id} /><input type="hidden" name="expectedVersion" value={ticket.reviewVersion} /><h2>Email reminder</h2><p>Send a reminder to every active account linked to an assigned officer. A role with two linked accounts receives two emails.</p><SubmitButton className="button button-quiet" type="submit" pendingLabel="Queuing…" disabled={!ticket.assignees.length}>Send reminder emails</SubmitButton>{!ticket.assignees.length && <p className="muted">Assign at least one officer first.</p>}</form>
        <div className="ticket-updated"><Clock3 size={14} /> Updated {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ticket.updatedAt))}</div></aside></div>
  </div>;
}
