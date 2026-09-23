import { describe, expect, it } from "vitest";
import { citedSuggestionSources, suggestedTitle } from "@/lib/tickets/suggestions";

const source = (id: string, sourceType: string, retrievalUnitId = "11111111-1111-4111-8111-111111111111") => ({ id, sourceType, retrievalUnitId });

describe("AI ticket proposal evidence", () => {
  it("requires a cited source of the requested family, with a real retrieval unit ID", () => {
    const citations = [source("S1", "slack_message"), source("S2", "meeting_notes"), source("S3", "slack_message", "not-a-uuid")];
    expect(citedSuggestionSources("Follow up with the venue. [S1]", "slack", citations)).toEqual([citations[0]]);
    expect(citedSuggestionSources("Follow up with the venue. [S2]", "slack", citations)).toEqual([]);
    expect(citedSuggestionSources("Follow up with the venue. [S3]", "slack", citations)).toEqual([]);
    expect(citedSuggestionSources("Follow up with the venue.", "slack", citations)).toEqual([]);
  });

  it("extracts an editable title without carrying a citation marker into it", () => {
    expect(suggestedTitle("**Title:** Confirm the next EFDS venue [S1]\nRationale: ...")).toBe("Confirm the next EFDS venue");
    expect(suggestedTitle("# Title:  Confirm data access [S2]")).toBe("Confirm data access");
  });
});
