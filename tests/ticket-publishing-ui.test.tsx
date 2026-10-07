// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Ticket } from "@/lib/db/tickets";

vi.mock("@/lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/actions/tickets", () => ({ ticketAction: vi.fn(), remindTicketAssignees: vi.fn(), updateIndividualTicketProgress: vi.fn() }));
vi.mock("@/lib/db/tickets", () => ({ getTicketWorkspace: vi.fn(async () => ({ tickets: [], officers: [], timelines: new Map(), slackSyncedAt: null })) }));

import NewTicketPage from "@/app/(private)/dashboard/tickets/new/page";
import TicketDetailPage from "@/app/(private)/dashboard/tickets/[id]/page";
import { getTicketWorkspace } from "@/lib/db/tickets";

const ticket: Ticket = {
  id: "11111111-1111-4111-8111-111111111111", title: "ACTION-024 — Test ticket", description: null,
  workstream: null, priority: "medium", dueAt: null, dueText: null, status: "open", reviewVersion: 1,
  createdAt: "2026-09-24T12:00:00Z", updatedAt: "2026-09-24T12:00:00Z", ownerText: null,
  sourceMessageId: null, assignees: [
    { id: "22222222-2222-4222-8222-222222222222", name: "One", role: "Events" },
    { id: "33333333-3333-4333-8333-333333333333", name: "Two", role: "Events" },
  ],
};

describe("website-first ticket lifecycle", () => {
  it("explains that creating a ticket queues a Slack announcement and completion stays on the website", async () => {
    render(await NewTicketPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText(/Slack announcement/i)).toBeTruthy();
    expect(screen.getByText(/completion.*website/i)).toBeTruthy();
  });
  it("explains shared status on a multi-assignee ticket and does not claim Slack delivery on save", async () => {
    vi.mocked(getTicketWorkspace).mockResolvedValue({ tickets: [ticket], officers: ticket.assignees, timelines: new Map(), slackSyncedAt: null });
    render(await TicketDetailPage({ params: Promise.resolve({ id: ticket.id }), searchParams: Promise.resolve({ saved: "create" }) }));
    expect(screen.getByText(/any committee member.*overall status/i)).toBeTruthy();
    expect(screen.getByText(/queued for Slack/i)).toBeTruthy();
  });
});
