// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { IndividualProgressPanel } from "@/components/tickets/individual-progress-panel";
import type { Ticket } from "@/lib/db/tickets";

vi.mock("@/lib/actions/tickets", () => ({ updateIndividualTicketProgress: vi.fn() }));

const ticket: Ticket = {
  id: "11111111-1111-4111-8111-111111111111", title: "Publish the briefing", description: null,
  workstream: "Research", priority: "medium", dueAt: null, dueText: null, status: "in_progress",
  reviewVersion: 4, createdAt: "2026-09-24T12:00:00Z", updatedAt: "2026-09-24T12:00:00Z",
  ownerText: null, sourceMessageId: null,
  assignees: [{ id: "22222222-2222-4222-8222-222222222222", name: "Alex", role: "Research" }, { id: "33333333-3333-4333-8333-333333333333", name: "Sam", role: "Events" }],
};

describe("individual ticket progress", () => {
  it("keeps shared progress as the default for a multi-assignee ticket", () => {
    render(<IndividualProgressPanel ticket={ticket} />);
    expect(screen.getByRole("button", { name: "Track progress by person" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByText("0 of 2 people completed")).toBeNull();
  });

  it("shows separate status controls only after committee enables the option", () => {
    render(<IndividualProgressPanel ticket={{ ...ticket, individualProgressEnabled: true, individualProgress: { [ticket.assignees[0].id]: "completed", [ticket.assignees[1].id]: "blocked" } }} />);
    expect(screen.getByRole("button", { name: "Use shared progress" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("1 of 2 people completed")).toBeTruthy();
    expect((screen.getByLabelText(/Alex/) as HTMLSelectElement).value).toBe("completed");
    expect((screen.getByLabelText(/Sam/) as HTMLSelectElement).value).toBe("blocked");
  });

  it("does not offer individual controls for a single assignee", () => {
    const { container } = render(<IndividualProgressPanel ticket={{ ...ticket, assignees: [ticket.assignees[0]] }} />);
    expect(container.innerHTML).toBe("");
  });
});
