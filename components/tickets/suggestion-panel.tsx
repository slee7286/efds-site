"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

type Result = { answer: string; citations: { id: string; title: string; sourceType: string; route: string | null; url: string | null }[]; limitations: string[]; sourceFocus: string; reviewable: boolean };

export function SuggestionPanel() {
  const [focus, setFocus] = useState<"meetings" | "slack">("meetings");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function suggest() {
    setPending(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/tickets/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ focus }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Suggestions are unavailable right now.");
      setResult(data as Result);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Suggestions are unavailable right now.");
    } finally {
      setPending(false);
    }
  }

  return <section className="ticket-suggestions" aria-labelledby="ticket-suggestions-heading"><div className="ticket-suggestions-intro"><div><span className="eyebrow">Admin · evidence review</span><h2 id="ticket-suggestions-heading">Find the next ticket.</h2><p>Ask the EFDS agent to surface possible work from available sources. Review every source before creating a ticket; nothing is published automatically.</p></div><Sparkles size={28} aria-hidden="true" /></div><div className="ticket-suggestions-controls"><label>Source focus<select className="select" value={focus} disabled={pending} onChange={(event) => setFocus(event.target.value as "meetings" | "slack")}><option value="meetings">Meeting notes</option><option value="slack">Slack discussions</option></select></label><button className="button button-dark" type="button" disabled={pending} onClick={suggest}>{pending ? "Reviewing evidence…" : "Suggest tickets"}</button></div><p className="ticket-suggestions-note">Recent Outlook mail is not connected. A few archived email files exist, but they are not a live mailbox history.</p>{error && <p className="form-error" role="alert">{error}</p>}{result && <div className="ticket-suggestions-result" role="status"><h3>Possible actions to review</h3><p>{result.answer}</p>{result.limitations.map((item) => <small key={item}>{item}</small>)}<div className="ticket-suggestions-citations"><strong>Sources returned</strong>{result.citations.length ? <ul>{result.citations.map((citation) => <li key={citation.id}>{citation.route ? <Link href={citation.route}>{citation.title} <ArrowUpRight size={13} /></Link> : citation.url ? <a href={citation.url} target="_blank" rel="noopener noreferrer">{citation.title} <ArrowUpRight size={13} /></a> : citation.title}<small>{citation.sourceType}</small></li>)}</ul> : <p>No citable sources were returned.</p>}</div>{result.reviewable ? <Link className="button button-primary" href="/dashboard/tickets/new">Create a reviewed ticket <ArrowUpRight size={15} /></Link> : <p className="form-error">No citable {result.sourceFocus === "meetings" ? "meeting notes" : "Slack messages"} were returned. Check the sources before creating a ticket.</p>}</div>}</section>;
}
