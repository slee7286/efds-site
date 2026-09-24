export type SuggestionFocus = "meetings" | "slack" | "committee" | "outlook";
export type SuggestionSource = {
  id: string;
  retrievalUnitId: string;
  sourceType: string;
  reviewStatus?: string;
  visibility?: string;
  authority?: string;
  route?: string | null;
  url?: string | null;
};

export function suggestedTitle(answer: string) {
  const first = answer.split(/\r?\n/).find((line) => line.trim()) ?? "";
  return first.replace(/^\s*(?:[#*>-]\s*)*/, "").replace(/^\*{0,2}title\*{0,2}\s*:\s*/i, "")
    .replace(/\[S\d+\]/g, "").replace(/\*\*/g, "").trim().slice(0, 300);
}

export function suggestedDescription(answer: string) {
  const lines = answer.split(/\r?\n/);
  const withoutTitle = /^\s*(?:[#*>-]\s*)*(?:\*{0,2}title\*{0,2})\s*:/i.test(lines[0] ?? "")
    ? lines.slice(1).join("\n").trim() : answer.trim();
  return (withoutTitle || answer.trim()).slice(0, 5000);
}

export function citedSuggestionSources<T extends SuggestionSource>(answer: string, focus: SuggestionFocus, citations: T[]): T[] {
  const allowed = focus === "meetings" ? new Set(["meeting_notes", "meeting_summary", "meeting_transcript"])
    : focus === "outlook" ? new Set(["outlook_message"]) : new Set(["slack_message"]);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return citations.filter((citation) => /^S\d+$/.test(citation.id) && uuid.test(citation.retrievalUnitId)
    && allowed.has(citation.sourceType) && answer.includes(`[${citation.id}]`)
    && (focus !== "committee" || (citation.reviewStatus === "source_generated"
      && citation.visibility === "committee" && citation.authority === "committee_slack"
      && citation.route?.startsWith("/dashboard/slack/messages/") === true))
    && (focus !== "outlook" || (citation.reviewStatus === "source_generated"
      && citation.visibility === "internal" && citation.authority === "outlook_mail"
      && Boolean(citation.url))));
}
