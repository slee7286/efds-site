// @vitest-environment jsdom

import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketClusters } from "@/components/tickets/ticket-clusters";
import type { Ticket } from "@/lib/db/tickets";

function ticket(id: string, workstream: string, status: Ticket["status"]): Ticket {
  return { id, title: `${workstream} ${id}`, description: null, workstream, priority: null, dueAt: null, dueText: null, status, reviewVersion: 1, createdAt: "2026-09-24T12:00:00Z", updatedAt: "2026-09-24T12:00:00Z", ownerText: null, sourceMessageId: null, assignees: [{ id: "alice", name: "Alice Lee", role: "Committee" }] };
}

describe("ticket groupings", () => {
  it("collapses completed cards separately in each workstream by default", () => {
    const tickets = [ticket("a", "Events", "open"), ticket("b", "Events", "completed"), ticket("c", "Finance", "completed")];
    render(<TicketClusters tickets={tickets} view="workstreams" timelines={new Map()} />);
    const events = screen.getByRole("heading", { name: "Events" }).closest<HTMLElement>(".ticket-cluster")!;
    const finance = screen.getByRole("heading", { name: "Finance" }).closest<HTMLElement>(".ticket-cluster")!;
    expect(within(events).getByText("Events a")).toBeTruthy();
    expect(events.querySelector("details")?.open).toBe(false);
    expect(finance.querySelector("details")?.open).toBe(false);
    fireEvent.click(within(events).getByText("1 completed ticket"));
    expect(events.querySelector("details")?.open).toBe(true);
    expect(finance.querySelector("details")?.open).toBe(false);
  });
});
