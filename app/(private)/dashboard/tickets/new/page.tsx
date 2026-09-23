import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SubmitButton } from "@/components/feedback/submit-button";
import { ticketAction } from "@/lib/actions/tickets";
import { isSupabaseConfigured } from "@/lib/config";
import { getTicketWorkspace } from "@/lib/db/tickets";

export default async function NewTicketPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams ?? {};
  const { tickets, officers } = await getTicketWorkspace();
  const workstreams = [...new Set(tickets.map((ticket) => ticket.workstream).filter((value): value is string => Boolean(value)))];
  return <div className="app-content ticket-page"><Link className="ticket-back" href="/dashboard/tickets"><ArrowLeft size={15} /> All tickets</Link><div className="eyebrow">Committee · new ticket</div><h1>Make the next<br />step clear.</h1><p className="app-subtitle">Give the work a concrete outcome, a person, and a date when there is one.</p>
    {params.error && <p className="form-error" role="alert">The ticket could not be saved. Check the details and try again.</p>}
    {!isSupabaseConfigured && <p className="form-preview-note" role="note">This local preview has no connected workspace, so saving is unavailable.</p>}
    <form className="surface info-card ticket-form" action={ticketAction}><fieldset disabled={!isSupabaseConfigured}><input type="hidden" name="action" value="create" /><label className="form-label">Ticket title<input className="input" name="title" maxLength={300} required placeholder="Verb + outcome, e.g. Confirm the events calendar" /></label><label className="form-label">What needs to happen<textarea className="textarea" name="description" rows={5} maxLength={5000} placeholder="Add the useful context and what would count as done." /></label><div className="ticket-form-grid"><label className="form-label">Workstream<input className="input" name="workstream" maxLength={100} list="ticket-workstreams" placeholder="Events, finance, research…" /><datalist id="ticket-workstreams">{workstreams.map((item) => <option key={item} value={item} />)}</datalist></label><label className="form-label">Priority<select className="select" name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="form-label">Due date<input className="input" type="date" name="dueDate" /></label></div><fieldset className="ticket-assignees"><legend>Assign committee members</legend><p>Choose everyone responsible. You can leave this empty and assign later.</p><div>{officers.map((officer) => <label key={officer.id}><input type="checkbox" name="assigneeIds" value={officer.id} /><span><strong>{officer.name}</strong><small>{officer.role}</small></span></label>)}</div>{!officers.length && <p>No active officers are available to assign in this workspace.</p>}</fieldset><SubmitButton className="button button-primary" type="submit">Create ticket</SubmitButton></fieldset></form>
  </div>;
}
