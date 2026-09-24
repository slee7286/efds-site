import type { TicketStatus } from "@/lib/db/tickets";

export type GraphTicket = {
  id: string;
  title: string;
  workstream: string | null;
  status: TicketStatus;
  priority: string | null;
  ownerText: string | null;
  assignees: { id: string; name: string; role: string }[];
};

export type GraphNode = {
  key: string;
  kind: "workstream" | "ticket" | "person";
  label: string;
  x: number;
  y: number;
  ticketIds: string[];
  role?: string;
  ticket?: GraphTicket;
};

export type GraphEdge = { key: string; kind: "workstream" | "assignment"; from: GraphNode; to: GraphNode; ticketId: string };
export type TicketGraphModel = {
  width: number;
  height: number;
  workstreams: GraphNode[];
  tickets: GraphNode[];
  people: GraphNode[];
  edges: GraphEdge[];
  clusters: { key: string; top: number; height: number }[];
};

const statusOrder: Record<TicketStatus, number> = { blocked: 0, in_progress: 1, open: 2, completed: 3, cancelled: 4 };
const rowGap = 60;
const groupGap = 48;

export function buildTicketGraph(tickets: GraphTicket[]): TicketGraphModel {
  const groups = new Map<string, GraphTicket[]>();
  for (const ticket of tickets) {
    const workstream = ticket.workstream?.trim() || "Unsorted";
    groups.set(workstream, [...(groups.get(workstream) ?? []), ticket]);
  }

  const workstreams: GraphNode[] = [];
  const clusters: TicketGraphModel["clusters"] = [];
  const ticketNodes: GraphNode[] = [];
  const people = new Map<string, { label: string; role?: string; ticketIds: string[]; positions: number[] }>();
  let nextY = 95;

  for (const [workstream, items] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const ordered = [...items].sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || a.title.localeCompare(b.title));
    const firstY = nextY;
    for (const ticket of ordered) {
      ticketNodes.push({ key: `ticket:${ticket.id}`, kind: "ticket", label: ticket.title, x: 209, y: nextY, ticketIds: [ticket.id], ticket });
      if (ticket.assignees.length) {
        for (const assignee of ticket.assignees) {
          const key = `person:${assignee.id}`;
          const person = people.get(key) ?? { label: assignee.name, role: assignee.role, ticketIds: [], positions: [] };
          if (!person.ticketIds.includes(ticket.id)) { person.ticketIds.push(ticket.id); person.positions.push(nextY); }
          people.set(key, person);
        }
      } else {
        const key = "person:unassigned";
        const person = people.get(key) ?? { label: "Roster unassigned", ticketIds: [], positions: [] };
        person.ticketIds.push(ticket.id);
        person.positions.push(nextY);
        people.set(key, person);
      }
      nextY += rowGap;
    }
    workstreams.push({ key: `workstream:${workstream}`, kind: "workstream", label: workstream, x: 18, y: (firstY + nextY - rowGap) / 2, ticketIds: ordered.map((item) => item.id) });
    clusters.push({ key: workstream, top: firstY - 28, height: ordered.length * rowGap - 4 });
    nextY += groupGap;
  }

  const height = Math.max(520, nextY + 45, people.size * 55 + 150);
  const orderedPeople = [...people.entries()].sort(([, a], [, b]) =>
    a.positions.reduce((total, y) => total + y, 0) / a.positions.length
    - b.positions.reduce((total, y) => total + y, 0) / b.positions.length
    || a.label.localeCompare(b.label));
  let lastY = 34;
  const personNodes: GraphNode[] = orderedPeople.map(([key, person], index) => {
    const desiredY = person.positions.reduce((total, y) => total + y, 0) / person.positions.length;
    const upper = height - 62 - (orderedPeople.length - 1 - index) * 55;
    const y = Math.max(lastY + 55, Math.min(desiredY, upper));
    lastY = y;
    return { key, kind: "person", label: person.label, role: person.role, x: 515, y, ticketIds: person.ticketIds };
  });

  const workstreamByName = new Map(workstreams.map((node) => [node.label, node]));
  const personByKey = new Map(personNodes.map((node) => [node.key, node]));
  const edges: GraphEdge[] = [];
  for (const node of ticketNodes) {
    const ticket = node.ticket!;
    const workstream = workstreamByName.get(ticket.workstream?.trim() || "Unsorted")!;
    edges.push({ key: `${workstream.key}->${node.key}`, kind: "workstream", from: workstream, to: node, ticketId: ticket.id });
    const assignees = ticket.assignees.length ? ticket.assignees.map((person) => `person:${person.id}`) : ["person:unassigned"];
    for (const key of new Set(assignees)) {
      const person = personByKey.get(key);
      if (person) edges.push({ key: `${node.key}->${key}`, kind: "assignment", from: node, to: person, ticketId: ticket.id });
    }
  }
  return { width: 848, height, workstreams, tickets: ticketNodes, people: personNodes, edges, clusters };
}
