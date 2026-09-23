import Link from "next/link";
import { ArrowUpRight, ChevronDown, MessagesSquare } from "lucide-react";
import type { SlackRecap } from "@/lib/db/slack-recap";

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });

export function DailySlackRecap({ recap, basePath }: { recap: SlackRecap; basePath: "/dashboard/slack" | "/admin/slack" }) {
  return <details className="slack-daily-recap">
    <summary><span className="slack-recap-icon"><MessagesSquare size={17} aria-hidden="true" /></span><span className="slack-recap-title"><strong>Daily Slack recap</strong><small>Past 24 hours · {recap.unavailable ? "Temporarily unavailable" : recap.messageCount ? `${recap.messageCount} archived ${recap.messageCount === 1 ? "message" : "messages"}` : "No new archived messages"}</small></span>{!recap.unavailable && recap.stale && <span className="slack-recap-stale">Sync needs attention</span>}<ChevronDown size={16} aria-hidden="true" /></summary>
    <div className="slack-recap-content">
      {!recap.unavailable && recap.stale && <p className="slack-recap-caution">The archive has not completed a refresh across all visible channels in the past 15 hours. Recent Slack activity may be missing.</p>}
      {recap.unavailable ? <p className="slack-recap-empty">The recap could not be loaded. Please try again later.</p> : recap.messages.length ? <ul>{recap.messages.map((message) => <li key={message.id}><span>#{message.channel} · {dateTime.format(new Date(message.postedAt))}</span><Link href={`${basePath}/messages/${message.id}`}>{message.text}<ArrowUpRight size={13} aria-hidden="true" /></Link></li>)}</ul> : <p className="slack-recap-empty">{recap.enabledChannels ? "No recent message excerpts to show. Open the archive for all activity." : "No Slack channels are enabled for this view."}</p>}
      <div className="slack-recap-footer"><span>{recap.lastCompleteSyncAt ? `Oldest refresh across ${recap.enabledChannels} visible channels: ${dateTime.format(new Date(recap.lastCompleteSyncAt))}` : "No completed refresh across all visible channels yet"}</span><Link href={basePath}>Search the archive <ArrowUpRight size={13} aria-hidden="true" /></Link></div>
    </div>
  </details>;
}
