import { SubmitButton } from "@/components/feedback/submit-button";
import { updateIndividualTicketProgress } from "@/lib/actions/tickets";
import type { Ticket } from "@/lib/db/tickets";

const statuses = [
  ["open", "Not started"],
  ["in_progress", "In progress"],
  ["blocked", "Blocked"],
  ["completed", "Completed"],
] as const;

export function IndividualProgressPanel({ ticket }: { ticket: Ticket }) {
  if (ticket.assignees.length < 2) return null;
  const enabled = ticket.individualProgressEnabled === true;
  const completed = ticket.assignees.filter((person) => ticket.individualProgress?.[person.id] === "completed").length;
  const hidden = <><input type="hidden" name="ticketId" value={ticket.id} /><input type="hidden" name="expectedVersion" value={ticket.reviewVersion} /></>;
  return <section className="surface info-card ticket-side-form ticket-individual-progress" aria-labelledby="individual-progress-heading">
    <h2 id="individual-progress-heading">Individual progress</h2>
    <p>Optional for tickets assigned to two or more people. The ticket’s overall status stays separate.</p>
    <form action={updateIndividualTicketProgress} className="ticket-progress-toggle">{hidden}<input type="hidden" name="progressAction" value="mode" /><input type="hidden" name="enabled" value={String(!enabled)} /><SubmitButton type="submit" className="button button-quiet" aria-pressed={enabled}>{enabled ? "Use shared progress" : "Track progress by person"}</SubmitButton></form>
    {enabled && <div className="ticket-progress-people"><p className="ticket-progress-count">{completed} of {ticket.assignees.length} people completed</p>{ticket.assignees.map((person) => <form key={person.id} action={updateIndividualTicketProgress} className="ticket-progress-person">{hidden}<input type="hidden" name="progressAction" value="status" /><input type="hidden" name="officerId" value={person.id} /><label className="form-label" htmlFor={`progress-${person.id}`}>{person.name}<small>{person.role}</small></label><div><select className="select" id={`progress-${person.id}`} name="individualStatus" defaultValue={ticket.individualProgress?.[person.id] ?? "open"}>{statuses.map(([status, label]) => <option value={status} key={status}>{label}</option>)}</select><SubmitButton type="submit" className="button button-dark" pendingLabel="Saving…">Save</SubmitButton></div></form>)}</div>}
  </section>;
}
