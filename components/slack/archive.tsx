import Link from "next/link";
import { ExternalLink, Paperclip, Search, ThumbsUp } from "lucide-react";
import type { SlackChannel, SlackMessage } from "@/types/domain";

export type SlackArchiveBasePath = "/admin/slack" | "/dashboard/slack";

function searchPath(basePath: SlackArchiveBasePath) {
  return basePath === "/admin/slack" ? `${basePath}/channels` : basePath;
}

function formatSlackDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

export function SlackNav({ basePath = "/admin/slack" }: { basePath?: SlackArchiveBasePath }) {
  return <nav className="tag-list" aria-label="Slack archive navigation" style={{ marginBottom: 24 }}>{basePath === "/admin/slack" && <Link className="tag" href={basePath}>Overview</Link>}<Link className="tag" href={searchPath(basePath)}>Search messages</Link></nav>;
}

export function SlackMessageCard({ message, compact = false, basePath = "/admin/slack" }: { message: SlackMessage; compact?: boolean; basePath?: SlackArchiveBasePath }) {
  return <article className={`surface info-card${message.isDeleted ? " slack-deleted" : ""}`} style={{ marginTop: 12 }}><div className="panel-heading"><div><strong>{message.authorName}</strong><small>{formatSlackDate(message.sourcePostedAt)}{message.sourceEditedAt ? " · edited" : ""}{message.threadTs && message.threadTs !== message.slackTs ? " · reply" : ""}</small></div><div className="tag-list">{message.sourceEditedAt && <span className="badge badge-coral">edited</span>}{message.isDeleted && <span className="badge badge-neutral">deleted</span>}{message.permalink && <a className="button button-quiet" href={message.permalink} target="_blank" rel="noreferrer" aria-label="Open original in Slack"><ExternalLink size={13} /></a>}</div></div><p style={{ whiteSpace: "pre-wrap", opacity: message.isDeleted ? 0.6 : 1 }}>{message.isDeleted ? "[Message deleted]" : message.text || "[No text]"}</p>{!compact && <div className="tag-list">{message.reactions.length > 0 && <span className="tag"><ThumbsUp size={12} /> {message.reactions.length} reactions</span>}{message.links.length > 0 && <span className="tag"><ExternalLink size={12} /> {message.links.length} links</span>}{message.files.length > 0 && <span className="tag"><Paperclip size={12} /> {message.files.length} files</span>}<Link className="tag" href={`${basePath}/messages/${message.id}`}>Provenance</Link></div>}</article>;
}

export function SlackChannelTable({ channels, basePath = "/admin/slack" }: { channels: SlackChannel[]; basePath?: SlackArchiveBasePath }) {
  return <div className="surface" style={{ overflowX: "auto" }}><table className="ops-table"><thead><tr><th>Channel</th><th>Visibility</th><th>Archive</th><th>Messages</th><th>Latest message</th><th>Last sync</th></tr></thead><tbody>{channels.map((channel) => <tr key={channel.id}><td><Link href={`${basePath}/channels/${channel.id}`}><strong>#{channel.name}</strong></Link><small>{channel.topic || channel.purpose || channel.id}</small></td><td>{channel.isPrivate ? "Private" : "Public"}{channel.archived && <small>Archived</small>}</td><td>{channel.syncEnabled ? <span className="badge badge-mint">enabled</span> : <span className="badge badge-neutral">disabled</span>}</td><td>{channel.messageCount}</td><td>{formatSlackDate(channel.latestMessageAt)}</td><td>{formatSlackDate(channel.lastSyncedAt)}</td></tr>)}</tbody></table>{!channels.length && <div className="empty-state"><h2>No archived Slack channels yet.</h2><p>Archived messages will appear here after an enabled channel is synced.</p></div>}</div>;
}

export function SlackSearchForm({ query = "", channel = "", author = "", from = "", to = "", edited = false, deleted = false, channels = [], authors = [], basePath = "/admin/slack" }: { query?: string; channel?: string; author?: string; from?: string; to?: string; edited?: boolean; deleted?: boolean; channels?: SlackChannel[]; authors?: { id: string; label: string }[]; basePath?: SlackArchiveBasePath }) {
  return <form className="slack-search-form" method="get" action={searchPath(basePath)}>
    <label className="form-label">Search message text<input className="input" name="q" defaultValue={query} placeholder="Search text…" /></label>
    <label className="form-label">Channel<select className="input" name="channel" defaultValue={channel}><option value="">All channels</option>{channels.map((item) => <option key={item.id} value={item.id}>#{item.name}</option>)}</select></label>
    <label className="form-label">Author<select className="input" name="author" defaultValue={author}><option value="">All authors</option>{authors.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label className="form-label">From<input className="input" type="date" name="from" defaultValue={from} /></label>
    <label className="form-label">To<input className="input" type="date" name="to" defaultValue={to} /></label>
    <div className="slack-search-actions"><label className="tag"><input type="checkbox" name="edited" value="true" defaultChecked={edited} /> edited</label><label className="tag"><input type="checkbox" name="deleted" value="true" defaultChecked={deleted} /> deleted</label><button className="button button-dark" type="submit"><Search size={14} /> Search</button></div>
  </form>;
}

export function ThreadedSlackMessages({ messages, basePath = "/admin/slack" }: { messages: SlackMessage[]; basePath?: SlackArchiveBasePath }) {
  const roots = messages.filter((message) => !message.threadTs || message.threadTs === message.slackTs);
  const byThread = new Map<string, SlackMessage[]>();
  for (const message of messages) if (message.threadTs && message.threadTs !== message.slackTs) byThread.set(message.threadTs, [...(byThread.get(message.threadTs) ?? []), message]);
  return <div>{roots.map((root) => <section key={root.id}><SlackMessageCard message={root} basePath={basePath} />{(byThread.get(root.slackTs) ?? []).map((reply) => <div style={{ marginLeft: 28 }} key={reply.id}><SlackMessageCard message={reply} compact basePath={basePath} /></div>)}</section>)}</div>;
}
