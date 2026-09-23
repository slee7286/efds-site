// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/operations", () => ({ operationalRecordAction: vi.fn() }));
import { SuggestionPanel } from "@/components/tickets/suggestion-panel";

describe("ticket suggestion proposal", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("offers a private proposal only when the answer has cited matching evidence", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({
      answer: "Title: Confirm venue availability [S1]\nMeeting notes request a booking. [S1]",
      citations: [{ id: "S1", retrievalUnitId: "11111111-1111-4111-8111-111111111111", title: "Events meeting", sourceType: "meeting_notes", route: "/admin/meetings/11111111-1111-4111-8111-111111111111", url: null }],
      citedSources: [{ id: "S1", retrievalUnitId: "11111111-1111-4111-8111-111111111111", title: "Events meeting", sourceType: "meeting_notes", route: "/admin/meetings/11111111-1111-4111-8111-111111111111", url: null }],
      limitations: [], sourceFocus: "meetings", reviewable: true,
    }) })));
    render(<SuggestionPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Suggest a ticket" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Save proposal for review/ })).toBeTruthy());
    expect((screen.getByRole("textbox", { name: "Proposed title" }) as HTMLInputElement).value).toBe("Confirm venue availability");
    expect(screen.getByRole("link", { name: /Events meeting/ }).getAttribute("href")).toContain("/admin/meetings/");
  });

  it("does not offer a save action when there is no cited source", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ answer: "A possible task", citations: [], citedSources: [], limitations: [], sourceFocus: "slack", reviewable: false }) })));
    render(<SuggestionPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Suggest a ticket" }));
    await waitFor(() => expect(screen.getByText(/No cited Slack message supports/)).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Save proposal for review/ })).toBeNull();
  });
});
