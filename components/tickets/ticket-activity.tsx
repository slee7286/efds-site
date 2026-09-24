import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TicketActivity, TicketTimeline } from "@/lib/tickets/activity";

const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" });

export function TicketActivityLog({ timeline, syncedAt }: { timeline: TicketTimeline | undefined; syncedAt: string | null }) {
  const entries: TicketActivity[] = timeline?.activity ?? [];
  return <section className="surface info-card ticket-activity" aria-labelledby="ticket-activity-title">
    <div className="ticket-activity-heading"><div><div className="eyebrow">Evidence &amp; decisions</div><h2 id="ticket-activity-title">Activity log</h2></div><span>{entries.length} {entries.length === 1 ? "entry" : "entries"}</span></div>
    <p className="ticket-activity-note">Dated Slack messages and committee actions, including reminder requests. Reaction dates show when the archive first saw the reaction.</p>
    {entries.length ? <ol className="ticket-activity-list">{entries.map((entry) => <li key={entry.id}>
      <div className="ticket-activity-marker" aria-hidden="true" />
      <div className="ticket-activity-entry"><div className="ticket-activity-top"><strong>{entry.actor}</strong><time dateTime={entry.at}>{entry.observedOnly ? "First seen " : ""}{date.format(new Date(entry.at))}</time></div>
      <p className="ticket-activity-action">{entry.action}</p>{entry.detail && <p className="ticket-activity-detail">{entry.detail}</p>}
      {entry.sourceMessageId && <Link href={`/dashboard/slack/messages/${entry.sourceMessageId}`}>View Slack evidence <ArrowUpRight size={13} /></Link>}
      </div></li>)}</ol> : <div className="ticket-activity-empty">No dated activity has been recorded yet. New Slack updates and committee edits will appear here after sync.</div>}
    <p className="ticket-activity-sync">{syncedAt ? `Slack archive last synced ${date.format(new Date(syncedAt))}.` : "Slack archive has not synced yet."}</p>
  </section>;
}
