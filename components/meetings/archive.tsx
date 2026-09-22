import Link from "next/link";
import { CalendarDays, Search } from "lucide-react";
import type { MeetingArchiveItem, MeetingArtifact, MeetingSourceChange, MeetingTranscriptSegment } from "@/types/domain";

function date(value: string | null) { return value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
function duration(value: number | null) { if (value === null) return "—"; const minutes = Math.floor(value / 60); return `${minutes} min`; }
function timestamp(value: number | null) { if (value === null) return "—"; const seconds = Math.max(0, Math.floor(value / 1000)); return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }

export function MeetingNav() { return <nav className="tag-list" aria-label="Meeting archive navigation" style={{ marginBottom: 24 }}><Link className="tag" href="/admin/meetings">Overview</Link><Link className="tag" href="/admin/meetings/all">All meetings</Link></nav>; }

export function MeetingTable({ items }: { items: MeetingArchiveItem[] }) {
  return <div className="surface" style={{ overflowX: "auto" }}><table className="ops-table"><thead><tr><th>Meeting</th><th>Date</th><th>Notes</th><th>Transcript</th><th>Summary</th><th>Changed</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><Link href={`/admin/meetings/${item.id}`}><strong>{item.title}</strong></Link><small>{item.externalMeetingId || item.sourceType}</small></td><td>{date(item.startedAt)}</td><td>{item.notesAvailable ? <span className="badge badge-mint">available</span> : <span className="badge badge-neutral">—</span>}</td><td>{item.transcriptAvailable ? <span className="badge badge-mint">available</span> : <span className="badge badge-neutral">missing</span>}</td><td>{item.summaryAvailable ? <span className="badge badge-mint">available</span> : <span className="badge badge-neutral">missing</span>}</td><td>{date(item.lastChangedAt || item.sourceUpdatedAt)}</td></tr>)}</tbody></table>{!items.length && <div className="empty-state"><CalendarDays size={22} /><h2>No meetings found.</h2><p>Meeting logs appear here after syncing Google Docs linked in the Slack meetings channel.</p></div>}</div>;
}

export function MeetingSearchForm({ query, from, to, hasTranscript, hasSummary }: { query?: string; from?: string; to?: string; hasTranscript?: boolean; hasSummary?: boolean }) {
  return <form className="ops-inline" method="get" action="/admin/meetings/all" style={{ margin: "18px 0", alignItems: "end", flexWrap: "wrap" }}><label className="form-label" style={{ flex: "1 1 260px" }}>Search meetings<input className="input" name="q" defaultValue={query} placeholder="Title or source ID…" /></label><label className="form-label">From<input className="input" type="date" name="from" defaultValue={from} /></label><label className="form-label">To<input className="input" type="date" name="to" defaultValue={to} /></label><label className="tag"><input type="checkbox" name="transcript" value="true" defaultChecked={hasTranscript} /> transcript</label><label className="tag"><input type="checkbox" name="summary" value="true" defaultChecked={hasSummary} /> summary</label><button className="button button-dark" type="submit"><Search size={14} /> Search</button></form>;
}

export function MeetingArtifacts({ artifacts }: { artifacts: MeetingArtifact[] }) {
  return <section className="surface info-card" style={{ marginTop: 24 }}><div className="panel-heading"><h2>Artifact history</h2><span className="muted">Immutable content versions</span></div><div className="queue-list">{artifacts.map((artifact) => <div className="queue-row" key={artifact.id}><div><strong>{artifact.artifactType}</strong>{artifact.isCurrent && <span className="badge badge-mint" style={{ marginLeft: 8 }}>current</span>}<small>{artifact.generatedBy === "meetily" && artifact.artifactType === "summary" ? "AI-generated Meetily summary" : artifact.format || "text"}</small><small><code>{artifact.contentHash}</code></small></div><small>{date(artifact.ingestedAt)}</small></div>)}</div>{!artifacts.length && <p className="muted">No artifacts have been imported.</p>}</section>;
}

export function MeetingTranscript({ segments, artifact }: { segments: MeetingTranscriptSegment[]; artifact?: MeetingArtifact }) {
  return <section className="surface info-card" style={{ marginTop: 24 }}><div className="panel-heading"><h2>Transcript</h2><span className="muted">Timestamped source capture</span></div>{segments.length ? <div className="transcript-list">{segments.map((segment) => <article className="transcript-row" key={segment.id}><time>{timestamp(segment.startMs)}</time><div><strong>{segment.speaker || "Speaker not identified"}</strong><p>{segment.text}</p></div></article>)}</div> : artifact?.content ? <pre className="document-preview">{artifact.content}</pre> : <p className="muted">No transcript content is available for the current artifact.</p>}</section>;
}

export function MeetingSummary({ artifact }: { artifact: MeetingArtifact | undefined }) {
  if (!artifact) return <section className="surface info-card" style={{ marginTop: 24 }}><div className="panel-heading"><h2>Summary</h2></div><p className="muted">No Meetily summary has been imported.</p></section>;
  return <section className="surface info-card" style={{ marginTop: 24 }}><div className="panel-heading"><h2>Summary</h2><span className="badge badge-coral">AI-generated Meetily summary</span></div><p className="muted" style={{ marginBottom: 14 }}>This is not committee-approved minutes or reviewed operational truth.</p><pre className="document-preview">{artifact.content}</pre><dl className="security-details" style={{ marginTop: 18 }}><div><dt>Hash</dt><dd><code>{artifact.contentHash}</code></dd></div><div><dt>Generated</dt><dd>{artifact.generatedBy || "Meetily"}</dd></div><div><dt>Template</dt><dd>{artifact.summaryTemplate || "Not provided"}</dd></div></dl></section>;
}

export function MeetingChanges({ changes }: { changes: MeetingSourceChange[] }) {
  return <section className="surface info-card" style={{ marginTop: 24 }}><div className="panel-heading"><h2>Source changes</h2></div>{changes.length ? <div className="queue-list">{changes.map((change) => <div className="queue-row" key={change.id}><div><strong>{change.changeType.replaceAll("_", " ")}</strong>{change.previousValue && <small>{change.previousValue} → {change.newValue || "—"}</small>}</div><small>{date(change.detectedAt)}</small></div>)}</div> : <p className="muted">No changes recorded yet.</p>}</section>;
}

export function MeetingFacts({ item, metadata }: { item: MeetingArchiveItem; metadata: Record<string, unknown> }) {
  return <dl className="security-details"><div><dt>When</dt><dd>{date(item.startedAt)}</dd></div><div><dt>Duration</dt><dd>{duration(item.durationSeconds)}</dd></div><div><dt>Source ID</dt><dd><code>{item.externalMeetingId || "—"}</code></dd></div><div><dt>Source</dt><dd>{item.sourceType}</dd></div><div><dt>Source reference</dt><dd>{typeof metadata.source_url === "string" ? metadata.source_url : typeof metadata.source_database === "string" ? metadata.source_database : typeof metadata.source_export === "string" ? metadata.source_export : "—"}</dd></div><div><dt>Last seen</dt><dd>{date(item.lastSeenAt)}</dd></div></dl>;
}

export function MeetingNotes({ artifact }: { artifact?: MeetingArtifact }) {
  if (!artifact) return null;
  const sourceUrl = artifact.sourceReference?.startsWith("https://docs.google.com/document/") ? artifact.sourceReference : null;
  return <section className="surface info-card" style={{ marginTop: 24 }}><div className="panel-heading"><h2>Meeting notes</h2>{sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer">Open Google Doc</a>}</div><p className="muted">Original document text. Approval and authorship are not inferred from the source.</p><pre className="document-preview">{artifact.content}</pre></section>;
}
