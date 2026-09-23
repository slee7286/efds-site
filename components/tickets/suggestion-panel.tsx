"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { SubmitButton } from "@/components/feedback/submit-button";
import { operationalRecordAction } from "@/lib/actions/operations";
import { committeeSuggestionAction } from "@/lib/actions/tickets";
import { suggestedDescription, suggestedTitle, type SuggestionFocus } from "@/lib/tickets/suggestions";

type Citation = {
  id: string;
  retrievalUnitId: string;
  title: string;
  sourceType: string;
  route: string | null;
  url: string | null;
};
type Result = {
  answer: string;
  citations: Citation[];
  citedSources: Citation[];
  limitations: string[];
  sourceFocus: string;
  reviewable: boolean;
};

export function SuggestionPanel({ isAdmin = true, officers = [] }: { isAdmin?: boolean; officers?: { id: string; name: string; role: string }[] }) {
  const [focus, setFocus] = useState<SuggestionFocus>(isAdmin ? "meetings" : "committee");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [error, setError] = useState("");

  async function suggest() {
    setPending(true);
    setError("");
    setResult(null);
    setSelectedUnit("");
    try {
      const response = await fetch("/api/tickets/suggest", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ focus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Suggestions are unavailable right now.");
      setResult(data as Result);
      setSelectedUnit((data as Result).citedSources?.[0]?.retrievalUnitId ?? "");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Suggestions are unavailable right now.");
    } finally {
      setPending(false);
    }
  }

  return <section className="ticket-suggestions" aria-labelledby="ticket-suggestions-heading">
    <div className="ticket-suggestions-intro"><div><span className="eyebrow">Committee · evidence review</span><h2 id="ticket-suggestions-heading">Find the next ticket.</h2><p>Ask the EFDS agent for a possible action. Review the cited source, edit the draft and assign people before publishing it to the committee.</p></div><Sparkles size={28} aria-hidden="true" /></div>
    <div className="ticket-suggestions-controls"><label>Source focus<select className="select" value={focus} disabled={pending} onChange={(event) => { setFocus(event.target.value as SuggestionFocus); setResult(null); }}><option value="committee">Committee Slack</option>{isAdmin && <option value="meetings">Meeting notes (admin)</option>}{isAdmin && <option value="slack">Full Slack archive (admin)</option>}</select></label><button className="button button-dark" type="button" disabled={pending} onClick={suggest}>{pending ? "Reviewing evidence…" : "Suggest a ticket"}</button>{isAdmin && <Link className="button button-quiet" href="/admin/operations/actions?review=proposed">Review saved admin proposals <ArrowUpRight size={14} /></Link>}</div>
    <p className="ticket-suggestions-note">Recent Outlook mail is not connected. Archived email files do not represent live mailbox history.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    {result && <div className="ticket-suggestions-result"><p className="sr-only" role="status">{result.reviewable ? "A source-backed suggestion is ready for review." : "No source-backed suggestion is available."}</p><h3>Agent suggestion</h3><p>{result.answer}</p>{result.limitations.map((item) => <small key={item}>{item}</small>)}
      <div className="ticket-suggestions-citations"><strong>Sources returned</strong>{result.citations.length ? <ul>{result.citations.map((citation) => <li key={`${citation.id}:${citation.retrievalUnitId}`}><span>[{citation.id}]</span>{citation.route ? <Link href={citation.route}>{citation.title} <ArrowUpRight size={13} /></Link> : citation.url ? <a href={citation.url} target="_blank" rel="noopener noreferrer">{citation.title} <ArrowUpRight size={13} /></a> : citation.title}<small>{citation.sourceType}</small></li>)}</ul> : <p>No citable sources were returned.</p>}</div>
      {result.reviewable && selectedUnit && result.sourceFocus === "committee" ? <form key={result.answer} className="ticket-proposal-form" action={committeeSuggestionAction}>
        <input type="hidden" name="retrievalUnitId" value={selectedUnit} />
        <div className="eyebrow">Review before publishing</div>
        <label className="form-label">Ticket title<input className="input" name="title" required maxLength={300} defaultValue={suggestedTitle(result.answer)} /></label>
        <label className="form-label">Action and rationale<textarea className="textarea" name="description" required maxLength={5000} rows={5} defaultValue={suggestedDescription(result.answer)} /></label>
        <div className="ticket-form-grid"><label className="form-label">Workstream<input className="input" name="workstream" maxLength={100} placeholder="Events, finance, research…" /></label><label className="form-label">Priority<select className="select" name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label></div>
        <label className="form-label">Primary evidence<select className="select" value={selectedUnit} onChange={(event) => setSelectedUnit(event.target.value)}>{result.citedSources.map((citation) => <option key={citation.retrievalUnitId} value={citation.retrievalUnitId}>[{citation.id}] {citation.title}</option>)}</select></label>
        <fieldset className="ticket-assignees"><legend>Assign committee members</legend><p>Choose the people responsible, or assign them later.</p><div>{officers.map((officer) => <label key={officer.id}><input type="checkbox" name="assigneeIds" value={officer.id} /><span><strong>{officer.name}</strong><small>{officer.role}</small></span></label>)}</div>{!officers.length && <p>No active officers are available to assign.</p>}</fieldset>
        <label className="ticket-source-review"><input type="checkbox" name="reviewedSource" value="yes" required /><span>I reviewed the cited Slack message and checked this action before publishing.</span></label>
        <SubmitButton className="button button-primary" type="submit">Publish reviewed ticket <ArrowUpRight size={15} /></SubmitButton>
      </form> : result.reviewable && selectedUnit ? <form key={result.answer} className="ticket-proposal-form" action={operationalRecordAction}>
        <input type="hidden" name="action" value="create" /><input type="hidden" name="recordType" value="action_item" />
        <input type="hidden" name="patch" value={JSON.stringify({ retrieval_unit_id: selectedUnit, evidence_role: "primary", metadata: { origin: "agent_ticket_suggestion", source_focus: result.sourceFocus } })} />
        <div className="eyebrow">Save for human review</div>
        <label className="form-label">Proposed title<input className="input" name="title" required maxLength={300} defaultValue={suggestedTitle(result.answer)} /></label>
        <label className="form-label">Proposed action and rationale<textarea className="textarea" name="description" required maxLength={5000} rows={5} defaultValue={suggestedDescription(result.answer)} /></label>
        <label className="form-label">Primary evidence<select className="select" value={selectedUnit} onChange={(event) => setSelectedUnit(event.target.value)}>{result.citedSources.map((citation) => <option key={citation.retrievalUnitId} value={citation.retrievalUnitId}>[{citation.id}] {citation.title}</option>)}</select></label>
        <p>The proposal stays private until an admin reviews and publishes it to the committee workspace.</p>
        <SubmitButton className="button button-primary" type="submit">Save proposal for review <ArrowUpRight size={15} /></SubmitButton>
      </form> : <p className="form-error">No cited {result.sourceFocus === "meetings" ? "meeting note" : "Slack message"} supports a reviewable draft. Check the sources before creating a ticket.</p>}
    </div>}
  </section>;
}
