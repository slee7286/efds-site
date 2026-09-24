// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/actions/operations", () => ({ operationalRecordAction: vi.fn() }));
vi.mock("@/lib/actions/tickets", () => ({ committeeSuggestionAction: vi.fn() }));
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

  it("requires committee review before publishing a cited draft", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({
      answer: "Title: Confirm venue availability [S1]\nFollow up with the venue. [S1]",
      citations: [{ id: "S1", retrievalUnitId: "11111111-1111-4111-8111-111111111111", title: "#events", sourceType: "slack_message", route: "/dashboard/slack/messages/22222222-2222-4222-8222-222222222222", url: null }],
      citedSources: [{ id: "S1", retrievalUnitId: "11111111-1111-4111-8111-111111111111", title: "#events", sourceType: "slack_message", route: "/dashboard/slack/messages/22222222-2222-4222-8222-222222222222", url: null }],
      limitations: [], sourceFocus: "committee", reviewable: true,
    }) })));
    render(<SuggestionPanel isAdmin={false} officers={[{ id: "33333333-3333-4333-8333-333333333333", name: "Alice", role: "Events" }]} />);
    expect(screen.queryByRole("option", { name: /Meeting notes/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Suggest a ticket" }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Publish reviewed ticket/ })).toBeTruthy());
    expect((screen.getByRole("checkbox", { name: /I reviewed the cited Slack message/ }) as HTMLInputElement).required).toBe(true);
    expect(screen.getByRole("checkbox", { name: /Alice/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /#events/ }).getAttribute("href")).toContain("/dashboard/slack/messages/");
  });

  it("offers Outlook as an admin source only after a successful sender sync", () => {
    const { rerender } = render(<SuggestionPanel isAdmin outlookSyncedAt={null} />);
    expect(screen.getByRole("option", { name: /Outlook mail/ })).toHaveProperty("disabled", true);
    rerender(<SuggestionPanel isAdmin outlookSyncedAt="2026-09-23T18:00:00Z" />);
    expect(screen.getByRole("option", { name: "Outlook mail (admin)" })).toHaveProperty("disabled", false);
    expect(screen.getByText(/Outlook evidence last synced/)).toBeTruthy();
  });
});
