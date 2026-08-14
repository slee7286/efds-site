import Link from "next/link";
import type { UnifiedRetrievalResult } from "@/types/domain";

const labels: Record<string, string> = { icu_article: "ICU article", knowledge_requirement: "Requirement", knowledge_timing_rule: "Timing rule", knowledge_process: "Process", knowledge_process_step: "Process step", knowledge_resource: "Resource", knowledge_contact: "Contact", document: "OneDrive document", slack_message: "Slack message", meeting_transcript: "Meeting transcript", meeting_summary: "Meetily summary", meeting_notes: "Meeting notes", operational_decision: "Operational decision", operational_action: "Operational action", operational_commitment: "Operational commitment", operational_question: "Operational question", operational_status: "Operational status" };

function Snippet({ value }: { value: string }) {
  const parts = value.split(/(<mark>|<\/mark>)/g);
  return <span>{parts.map((part, index) => { if (part === "<mark>" || part === "</mark>") return null; const marked = parts.slice(0, index).filter((item) => item === "<mark>").length > parts.slice(0, index).filter((item) => item === "</mark>").length; return marked ? <mark key={index}>{part}</mark> : <span key={index}>{part.replace(/<[^>]*>/g, "")}</span>; })}</span>;
}

function resultHref(result: UnifiedRetrievalResult, admin: boolean) {
  if (!admin) return null;
  if (result.sourceType === "document") return `/admin/documents/files/${result.sourceRecordId}`;
  if (result.sourceType === "slack_message") return `/admin/slack/messages/${result.sourceRecordId}`;
  if (["meeting_transcript", "meeting_summary", "meeting_notes"].includes(result.sourceType)) return `/admin/meetings/${result.sourceRecordId}`;
  if (result.sourceType.startsWith("operational_")) return `/admin/operations/${result.sourceRecordId}`;
  if (result.sourceType === "icu_article") return `/admin/knowledge/articles/${result.sourceRecordId}`;
  if (result.sourceType === "knowledge_process") return `/admin/knowledge/processes/${result.sourceRecordId}`;
  const reviewType = result.sourceType.replace(/^knowledge_/, "");
  return `/admin/knowledge/review/${reviewType}/${result.sourceRecordId}`;
}

export function UnifiedSearch({ results, query, admin, source, area, channel, author, from, to, history }: { results: UnifiedRetrievalResult[]; query: string; admin: boolean; source?: string; area?: string; channel?: string; author?: string; from?: string; to?: string; history?: boolean }) {
  return <>
    <form className="surface info-card" method="get" style={{ display: "flex", gap: 10, margin: "24px 0", flexWrap: "wrap" }}>
      <label htmlFor="search-query" className="sr-only">Search EFDS</label>
      <input id="search-query" name="q" defaultValue={query} placeholder="Search ICU, processes, documents and more" style={{ flex: "1 1 240px" }} />
      <select name="source" defaultValue={source ?? ""} aria-label="Filter by source"><option value="">All sources</option><option value="knowledge_requirement">Requirements</option><option value="knowledge_process">Processes</option><option value="knowledge_resource">Resources</option><option value="icu_article">ICU articles</option>{admin && <><option value="document">OneDrive documents</option><option value="slack_message">Slack messages</option><option value="meeting_transcript">Meeting transcripts</option><option value="meeting_summary">Meetily summaries</option><option value="operational_decision">Operational decisions</option><option value="operational_action">Operational actions</option><option value="operational_question">Operational questions</option></>}</select>
      <input name="area" defaultValue={area ?? ""} placeholder="Area" aria-label="Source area" />{admin && <><input name="channel" defaultValue={channel ?? ""} placeholder="Slack channel" aria-label="Slack channel" /><input name="author" defaultValue={author ?? ""} placeholder="Author" aria-label="Author" /></>}<input name="from" type="date" defaultValue={from ?? ""} aria-label="From date" /><input name="to" type="date" defaultValue={to ?? ""} aria-label="To date" />{admin && <label className="muted"><input name="history" type="checkbox" value="1" defaultChecked={history} /> history</label>}
      <button className="button button-primary" type="submit">Search</button>
    </form>
    {query && <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>{results.length} result{results.length === 1 ? "" : "s"} for “{query}”</p>}
    <section aria-live="polite">
      {results.map((result) => { const href = resultHref(result, admin); const card = <article className="surface info-card" key={result.retrievalUnitId} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span className="badge badge-coral">{labels[result.sourceType] ?? result.sourceType}</span><small className="muted">{result.isCurrent ? "Current" : "History"}</small></div><h2 style={{ fontSize: 18, margin: "12px 0 8px" }}>{result.title}</h2><p style={{ lineHeight: 1.6, fontSize: 13 }}><Snippet value={result.snippet} /></p><div className="muted" style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, marginTop: 12 }}>{result.sourceArea && <span>{result.sourceArea}</span>}{result.channel && <span>#{result.channel}</span>}{result.author && <span>{result.author}</span>}{result.relativePath && <span>{result.relativePath}</span>}{result.permalink && <span>Slack source preserved</span>}</div></article>; return <div key={result.retrievalUnitId}>{href ? <Link href={href} style={{ display: "block" }}>{card}</Link> : card}{admin && <Link className="tag" href={`/admin/operations/new?evidence=${encodeURIComponent(result.retrievalUnitId)}`}>Create proposed operational record from this evidence</Link>}</div>; })}
      {query && !results.length && <div className="surface info-card"><p className="muted">No permitted current sources matched this search.</p></div>}
      {!query && <div className="surface info-card"><p className="muted">Search across the sources available to your EFDS role.</p></div>}
    </section>
  </>;
}
