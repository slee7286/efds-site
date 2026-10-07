// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { Ticket } from "@/lib/db/tickets";

const { getTicketWorkspace, getCurrentProfile } = vi.hoisted(() => ({ getTicketWorkspace: vi.fn(), getCurrentProfile: vi.fn() }));
vi.mock("@/lib/db/tickets", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/db/tickets")>()), getTicketWorkspace, getOutlookSyncStatus: vi.fn(async () => null) }));
vi.mock("@/lib/auth/server", () => ({ getCurrentProfile }));
vi.mock("@/components/tickets/ticket-graph", () => ({ TicketGraph: ({ tickets }: { tickets: Ticket[] }) => <div data-testid="ticket-graph">{tickets.filter((ticket) => ticket.status !== "completed" && ticket.status !== "cancelled").map((ticket) => <span key={ticket.id}>{ticket.title}</span>)}</div> }));
vi.mock("@/components/tickets/ticket-clusters", () => ({ TicketClusters: ({ tickets }: { tickets: Ticket[] }) => <div data-testid="ticket-clusters">{tickets.map((ticket) => <span key={ticket.id}>{ticket.title}</span>)}</div> }));
vi.mock("@/components/tickets/suggestion-panel", () => ({ SuggestionPanel: () => null }));

import TicketsPage from "@/app/(private)/dashboard/tickets/page";

const example = (id: string, title: string, status: Ticket["status"], assigneeId: string | null = null): Ticket => ({
  id, title, status, description: null, workstream: null, priority: null, dueAt: null, dueText: null,
  reviewVersion: 1, createdAt: "2026-09-24T12:00:00Z", updatedAt: "2026-09-24T12:00:00Z", ownerText: null,
  sourceMessageId: null, assignees: assigneeId ? [{ id: assigneeId, name: assigneeId === "alice" ? "Alice Lee" : "Ben Patel", role: "Committee" }] : [],
});
const tickets = [example("one", "Alice task", "open", "alice"), example("two", "Ben task", "open", "ben"), example("three", "Historical task", "cancelled", "alice")];

function setup(profile: { accessRole: string; officerId: string | null } = { accessRole: "committee", officerId: "alice" }) {
  getTicketWorkspace.mockResolvedValue({ tickets, officers: [], timelines: new Map(), slackSyncedAt: null });
  getCurrentProfile.mockResolvedValue(profile);
}

describe("ticket archive view", () => {
  it("keeps cancelled tickets out of the graph by default and labels the collapsed archive", async () => {
    setup();
    render(await TicketsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByTestId("ticket-graph").textContent).toContain("Alice task");
    expect(screen.getByTestId("ticket-graph").textContent).not.toContain("Historical task");
    expect(screen.getByRole("option", { name: "Current and completed; cancelled collapsed" })).toBeTruthy();
  });

  it("includes cancelled tickets in the default grouped board so their collapsed section is reachable", async () => {
    setup();
    render(await TicketsPage({ searchParams: Promise.resolve({ view: "workstreams" }) }));
    const team = screen.getByRole("region", { name: "Everyone's tickets" });
    expect(team.textContent).toContain("Historical task");
    expect(team.textContent).toContain("Alice task");
    expect(team.textContent).toContain("Ben task");
  });

  it("shows the collapsed archive list when cancellation is selected from the default graph view", async () => {
    setup();
    render(await TicketsPage({ searchParams: Promise.resolve({ status: "cancelled" }) }));
    const team = within(screen.getByRole("region", { name: "Everyone's tickets" }));
    expect(team.getByTestId("ticket-clusters").textContent).toContain("Historical task");
    expect(team.getByTestId("ticket-clusters").textContent).not.toContain("Ben task");
  });

  it("shows a committee member their assigned tickets before the team-wide overview", async () => {
    setup();
    render(await TicketsPage({ searchParams: Promise.resolve({}) }));
    const personal = screen.getByRole("region", { name: "Your assigned tickets" });
    expect(personal.textContent).toContain("Alice task");
    expect(personal.textContent).not.toContain("Ben task");
    const team = screen.getByRole("region", { name: "Everyone's tickets" });
    expect(team.textContent).toContain("Alice task");
    expect(team.textContent).toContain("Ben task");
    expect(screen.getByRole("region", { name: "Ticket status" }).querySelector("strong")?.textContent).toBe("2");
  });

  it("keeps the administrator view team-wide without a personal-only section", async () => {
    setup({ accessRole: "admin", officerId: "alice" });
    render(await TicketsPage({ searchParams: Promise.resolve({}) }));
    expect(screen.queryByRole("region", { name: "Your assigned tickets" })).toBeNull();
    expect(screen.getByRole("region", { name: "Everyone's tickets" }).textContent).toContain("Ben task");
  });
});
