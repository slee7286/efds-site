export type SuggestionSource = { id: string; retrievalUnitId: string; sourceType: string };

export function suggestedTitle(answer: string) {
  const first = answer.split(/\r?\n/).find((line) => line.trim()) ?? "";
  return first.replace(/^\s*(?:[#*>-]\s*)*/, "").replace(/^\*{0,2}title\*{0,2}\s*:\s*/i, "")
    .replace(/\[S\d+\]/g, "").replace(/\*\*/g, "").trim().slice(0, 300);
}

export function citedSuggestionSources<T extends SuggestionSource>(answer: string, focus: "meetings" | "slack", citations: T[]): T[] {
  const allowed = focus === "meetings" ? new Set(["meeting_notes", "meeting_summary", "meeting_transcript"]) : new Set(["slack_message"]);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return citations.filter((citation) => /^S\d+$/.test(citation.id) && uuid.test(citation.retrievalUnitId)
    && allowed.has(citation.sourceType) && answer.includes(`[${citation.id}]`));
}
