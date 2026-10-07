// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TicketGraph } from "@/components/tickets/ticket-graph";
import { buildTicketGraph, type GraphTicket } from "@/lib/tickets/graph";

const tickets: GraphTicket[] = [
  { id: "ticket-a", title: "Confirm speaker", workstream: "Events", status: "blocked", priority: "high", ownerText: null, assignees: [{ id: "alice", name: "Alice Lee", role: "Events lead" }, { id: "ben", name: "Ben Patel", role: "Treasurer" }] },
  { id: "ticket-b", title: "Publish timetable", workstream: "Events", status: "open", priority: null, ownerText: null, assignees: [{ id: "alice", name: "Alice Lee", role: "Events lead" }] },
  { id: "ticket-c", title: "Check budget", workstream: "Finance", status: "in_progress", priority: "medium", ownerText: "Legacy owner", assignees: [] },
];

describe("ticket relationship graph", () => {
  it("never includes completed or cancelled work in the graph or its people and workstreams", () => {
    const completed: GraphTicket = { ...tickets[0], id: "ticket-d", title: "Finished Events", status: "completed", workstream: "Done", assignees: [{ id: "done", name: "Former owner", role: "Events" }] };
    const cancelled: GraphTicket = { ...tickets[0], id: "ticket-e", title: "Cancelled Events", status: "cancelled", workstream: "Archived", assignees: [{ id: "cancelled", name: "Past owner", role: "Events" }] };
    const model = buildTicketGraph([...tickets, completed, cancelled]);
    expect(model.tickets.map((node) => node.label)).toEqual(expect.not.arrayContaining(["Finished Events", "Cancelled Events"]));
    expect(model.workstreams.map((node) => node.label)).toEqual(expect.not.arrayContaining(["Done", "Archived"]));
    expect(model.people.map((node) => node.label)).toEqual(expect.not.arrayContaining(["Former owner", "Past owner"]));
    const { container } = render(<TicketGraph tickets={[...tickets, completed, cancelled]} />);
    expect(screen.queryByRole("link", { name: /Finished Events|Cancelled Events/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Show.*completed/ })).toBeNull();
    expect(container.querySelectorAll(".graph-ticket")).toHaveLength(3);
  });

  it("builds only recorded workstream and assignment links, including unassigned work", () => {
    const graph = buildTicketGraph(tickets);
    expect(graph.workstreams.map((node) => node.label)).toEqual(["Events", "Finance"]);
    expect(graph.people.map((node) => node.label)).toContain("Roster unassigned");
    expect(graph.edges).toHaveLength(7); // Three workstream links and four assignment links.
    expect(graph.edges.filter((edge) => edge.from.kind === "ticket" && edge.to.kind === "ticket")).toHaveLength(0);
    expect(graph.people.find((node) => node.label === "Alice Lee")?.ticketIds).toEqual(["ticket-a", "ticket-b"]);
    expect(new Set(graph.people.map((node) => node.y)).size).toBe(graph.people.length);
  });

  it("lets committee members focus a workstream or person and open a ticket", () => {
    const { container } = render(<TicketGraph tickets={tickets} />);
    const inspector = screen.getByRole("complementary", { name: "Graph selection details" });
    expect(within(inspector).getByText("3")).toBeTruthy();
    expect(container.querySelectorAll(".ticket-graph-lines path")).toHaveLength(3); // One quiet workstream link per ticket.

    const events = screen.getByRole("button", { name: "Focus workstream Events, 2 tickets" });
    fireEvent.click(events);
    expect(container.querySelectorAll(".ticket-graph-lines path")).toHaveLength(2); // No assignment tangle for a whole cluster.
    expect(events.getAttribute("aria-pressed")).toBe("true");
    expect(within(inspector).getByRole("heading", { name: "Events" })).toBeTruthy();
    expect(within(inspector).getAllByRole("link")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Focus Alice Lee, 2 tickets" }));
    expect(container.querySelectorAll(".ticket-graph-lines path")).toHaveLength(4); // Two workstream and two focused assignment links.
    expect(within(inspector).getByRole("heading", { name: "Alice Lee" })).toBeTruthy();
    expect(within(inspector).getByText("Events lead")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open ticket Confirm speaker, Blocked" }).getAttribute("href")).toBe("/dashboard/tickets/ticket-a");
    fireEvent.click(screen.getByRole("button", { name: "Clear graph selection" }));
    expect(within(inspector).getByRole("heading", { name: "Follow the work." })).toBeTruthy();
  });

  it("keeps people in their own rail and shows an empty graph when only closed tickets remain", () => {
    const completed: GraphTicket = { ...tickets[0], id: "ticket-d", title: "Send event recap", status: "completed" };
    const cancelled: GraphTicket = { ...tickets[1], id: "ticket-e", title: "Cancel event", status: "cancelled" };
    const { container, rerender } = render(<TicketGraph tickets={[...tickets, completed, cancelled]} />);
    expect(container.querySelector(".ticket-graph-people-rail")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Open ticket Send event recap, Completed" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Open ticket Cancel event, Cancelled" })).toBeNull();
    rerender(<TicketGraph tickets={[completed, cancelled]} />);
    expect(screen.getByRole("heading", { name: "No active relationships yet." })).toBeTruthy();
    expect(screen.queryByRole("region", { name: /Interactive ticket graph/ })).toBeNull();
  });
});
