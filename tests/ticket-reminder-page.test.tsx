// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Ticket } from "../lib/db/tickets";

const { getTicketWorkspace } = vi.hoisted(() => ({ getTicketWorkspace: vi.fn() }));
vi.mock("../lib/db/tickets", () => ({ getTicketWorkspace }));
vi.mock("../lib/actions/tickets", () => ({
  ticketAction: vi.fn(),
  remindTicketAssignees: vi.fn(),
}));

import TicketDetailPage from "../app/(private)/dashboard/tickets/[id]/page";

const ticket: Ticket = {
  id: "11111111-1111-4111-8111-111111111111", title: "Confirm speaker",
  description: "Contact the speaker.", workstream: "Events", priority: "medium",
  dueAt: null, dueText: null, status: "open", reviewVersion: 3,
  createdAt: "2026-09-24T12:00:00Z", updatedAt: "2026-09-24T12:00:00Z",
  ownerText: null, sourceMessageId: null,
  assignees: [{ id: "22222222-2222-4222-8222-222222222222", name: "Example Officer", role: "Events" }],
};

function workspace(current: Ticket) {
  getTicketWorkspace.mockResolvedValue({
    tickets: [current], officers: current.assignees,
    timelines: new Map(), slackSyncedAt: null,
  });
}
function page(searchParams = Promise.resolve({})) {
  return TicketDetailPage({ params: Promise.resolve({ id: ticket.id }), searchParams });
}

describe("ticket reminder controls", () => {
  it("shows a reminder action and the number of queued account emails", async () => {
    workspace(ticket);
    render(await page(Promise.resolve({ reminded: "2" })));
    expect(screen.getByRole("button", { name: "Send reminder emails" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("2 linked accounts");
  });

  it("keeps the control visible but disabled until an officer is assigned", async () => {
    workspace({ ...ticket, assignees: [] });
    render(await page());
    expect(screen.getByRole("button", { name: "Send reminder emails" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Assign at least one officer first.")).toBeTruthy();
  });
});
