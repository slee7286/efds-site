import Link from "next/link";
import { ArrowLeft, ExternalLink, Paperclip, ThumbsUp } from "lucide-react";
import { getSlackMessage } from "@/lib/db/slack";
import { formatDate, StatusBadge } from "@/components/knowledge/operations";
import { SlackMessageCard } from "@/components/slack/archive";

export default async function SlackMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSlackMessage(id);
  if (!result) return <div className="app-content"><Link className="button button-quiet" href="/admin/slack/channels"><ArrowLeft size={14} /> Back to Slack archive</Link><h1>Message not found</h1></div>;
  const { message, changes } = result;
  return <div className="app-content">
    <Link className="button button-quiet" href={`/admin/slack/channels/${message.channelId}`}><ArrowLeft size={14} /> Back to #{message.channelName}</Link>
    <div style={{ marginTop: 22, maxWidth: 900 }}>
      <div className="eyebrow">Slack provenance</div>
      <div className="ops-inline" style={{ justifyContent: "space-between" }}>
        <div><h1>Message record</h1><p className="app-subtitle">#{message.channelName} · {message.authorName}</p></div>
        {message.isDeleted && <StatusBadge status="deleted" />}
      </div>
      <SlackMessageCard message={message} />
      <section className="surface info-card" style={{ marginTop: 18 }}>
        <div className="panel-heading"><h2>Source metadata</h2>{message.permalink && <a className="button button-quiet" href={message.permalink} target="_blank" rel="noreferrer">Open in Slack <ExternalLink size={13} /></a>}</div>
        <dl className="security-details">
          <div><dt>Slack timestamp</dt><dd><code>{message.slackTs}</code></dd></div>
          <div><dt>Posted</dt><dd>{formatDate(message.sourcePostedAt)}</dd></div>
          <div><dt>Edited</dt><dd>{formatDate(message.sourceEditedAt)}</dd></div>
          <div><dt>First seen / last seen</dt><dd>{formatDate(message.firstSeenAt)} / {formatDate(message.lastSeenAt)}</dd></div>
          <div><dt>Content hash</dt><dd><code>{message.contentHash ?? "—"}</code></dd></div>
          <div><dt>Thread</dt><dd>{message.threadTs ?? "Root message"}</dd></div>
        </dl>
        <div className="tag-list">{message.reactions.length > 0 && <span className="tag"><ThumbsUp size={12} /> {message.reactions.length} reactions</span>}{message.files.length > 0 && <span className="tag"><Paperclip size={12} /> {message.files.length} file metadata records</span>}</div>
        {message.files.length > 0 && <div style={{ marginTop: 18 }}><h3>File metadata</h3><ul>{message.files.map((file) => <li key={file.id}>{file.permalink ? <a href={file.permalink} target="_blank" rel="noreferrer">{file.filename || file.title || file.id}</a> : file.filename || file.title || file.id}{file.mimeType ? ` · ${file.mimeType}` : ""}{file.sizeBytes !== null ? ` · ${file.sizeBytes} bytes` : ""}</li>)}</ul></div>}
      </section>
      <section className="surface info-card" style={{ marginTop: 18 }}>
        <div className="panel-heading"><h2>Change history</h2><span className="muted">{changes.length}</span></div>
        {changes.map((change) => <div className="queue-row" key={change.id}><div><h3>{change.changeType}</h3><p>{formatDate(change.detectedAt)}{change.sourceEditedAt ? ` · source edited ${formatDate(change.sourceEditedAt)}` : ""}</p>{change.previousText !== null && <details><summary>Previous text</summary><p style={{ whiteSpace: "pre-wrap" }}>{change.previousText}</p></details>}</div></div>)}
        {!changes.length && <p className="muted">No changes recorded.</p>}
      </section>
    </div>
  </div>;
}
