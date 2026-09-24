import { describe, expect, it } from "vitest";
import { citedSuggestionSources, suggestedDescription, suggestedTitle } from "@/lib/tickets/suggestions";

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
    expect(suggestedDescription("Title: Confirm data access [S2]\nThe research lead should check the approval. [S2]")).toBe("The research lead should check the approval. [S2]");
  });

  it("requires committee citations to come from the scoped Slack retrieval route", () => {
    const safe = { ...source("S1", "slack_message"), reviewStatus: "source_generated", visibility: "committee", authority: "committee_slack", route: "/dashboard/slack/messages/22222222-2222-4222-8222-222222222222" };
    const unsafe = { ...safe, id: "S2", visibility: "internal" };
    const wrongRoute = { ...safe, id: "S3", route: "/admin/slack/messages/22222222-2222-4222-8222-222222222222" };
    expect(citedSuggestionSources("Confirm the venue. [S1] [S2] [S3]", "committee", [safe, unsafe, wrongRoute])).toEqual([safe]);
  });

  it("accepts a cited Outlook source only within the admin Outlook mode", () => {
    const mail = { ...source("S1", "outlook_message"), reviewStatus: "source_generated", visibility: "internal", authority: "outlook_mail", url: "https://outlook.office.com/mail/id/example" };
    expect(citedSuggestionSources("Check the date. [S1]", "outlook", [mail])).toEqual([mail]);
    expect(citedSuggestionSources("Check the date. [S1]", "committee", [mail])).toEqual([]);
  });
});
