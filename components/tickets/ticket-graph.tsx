"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Network, X } from "lucide-react";
import { statusLabel } from "@/components/tickets/ticket-card";
import { buildTicketGraph, type GraphNode, type GraphTicket } from "@/lib/tickets/graph";

function pathBetween(from: GraphNode, to: GraphNode) {
  const startX = from.kind === "workstream" ? from.x + 174 : from.x + 276;
  const endX = to.x;
  const bend = (endX - startX) * 0.48;
  return `M ${startX} ${from.y} C ${startX + bend} ${from.y}, ${endX - bend} ${to.y}, ${endX} ${to.y}`;
}

export function TicketGraph({ tickets }: { tickets: GraphTicket[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const graph = useMemo(() => buildTicketGraph(tickets), [tickets]);
  const nodes = useMemo(() => [...graph.workstreams, ...graph.tickets, ...graph.people], [graph]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const activeKey = hoverKey ?? selectedKey;
  const activeNode = nodes.find((node) => node.key === activeKey);
  const activeTicketIds = new Set(activeNode?.ticketIds ?? []);
  const related = (node: GraphNode) => !activeNode || node.ticketIds.some((id) => activeTicketIds.has(id));
  const connectedTickets = activeNode ? graph.tickets.filter((node) => activeTicketIds.has(node.ticket!.id)) : [];

  function focusNode(key: string) {
    setSelectedKey((current) => current === key ? null : key);
    setHoverKey(null);
  }

  return <section className="ticket-graph" aria-labelledby="ticket-graph-heading">
    <div className="ticket-graph-heading">
      <div><span className="eyebrow">Committee relationship map</span><h2 id="ticket-graph-heading">Projects, tickets, people.</h2><p>Click a workstream or person to trace their tickets. Click a ticket to open its details.</p></div>
      <div className="ticket-graph-key" aria-label="Ticket status key"><span><i className="graph-dot graph-dot-blocked" /> Blocked</span><span><i className="graph-dot graph-dot-in_progress" /> In progress</span><span><i className="graph-dot graph-dot-open" /> Open</span><span><i className="graph-dot graph-dot-completed" /> Completed</span><span><i className="graph-dot graph-dot-cancelled" /> Cancelled</span></div>
    </div>
    <div className="ticket-graph-jumps" aria-label="Move through graph columns"><span>Jump to</span><button type="button" onClick={() => viewport.current?.scrollTo({ left: 0 })}>Workstreams</button><button type="button" onClick={() => viewport.current?.scrollTo({ left: 268 })}>Tickets</button><button type="button" onClick={() => viewport.current?.scrollTo({ left: graph.width })}>People</button></div>
    <div className="ticket-graph-layout">
      <div ref={viewport} className="ticket-graph-viewport" role="region" aria-label="Interactive ticket graph; scroll to explore" tabIndex={0}>
        <div className="ticket-graph-canvas" style={{ width: graph.width, height: graph.height }}>
          <div className="ticket-graph-axis ticket-graph-axis-workstreams">01 / Workstreams</div>
          <div className="ticket-graph-axis ticket-graph-axis-tickets">02 / Tickets</div>
          <div className="ticket-graph-axis ticket-graph-axis-people">03 / People</div>
          <svg className="ticket-graph-lines" width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} aria-hidden="true" focusable="false">
            {graph.edges.map((edge) => <path key={edge.key} d={pathBetween(edge.from, edge.to)} className={activeNode ? activeTicketIds.has(edge.ticketId) ? "graph-line graph-line-active" : "graph-line graph-line-muted" : "graph-line"} />)}
          </svg>
          {graph.workstreams.map((node) => <button key={node.key} type="button" className={`graph-node graph-workstream${related(node) ? "" : " graph-node-muted"}${selectedKey === node.key ? " graph-node-selected" : ""}`} style={{ left: node.x, top: node.y }} onClick={() => focusNode(node.key)} onMouseEnter={() => setHoverKey(node.key)} onMouseLeave={() => setHoverKey(null)} onFocus={() => setHoverKey(node.key)} onBlur={() => setHoverKey(null)} aria-pressed={selectedKey === node.key} aria-label={`Focus workstream ${node.label}, ${node.ticketIds.length} tickets`} title={node.label}><span className="graph-node-name">{node.label}</span><span className="graph-node-count">{node.ticketIds.length}</span></button>)}
          {graph.tickets.map((node) => <Link key={node.key} className={`graph-node graph-ticket graph-ticket-${node.ticket!.status}${related(node) ? "" : " graph-node-muted"}`} style={{ left: node.x, top: node.y }} href={`/dashboard/tickets/${node.ticket!.id}`} prefetch={false} onMouseEnter={() => setHoverKey(node.key)} onMouseLeave={() => setHoverKey(null)} onFocus={() => setHoverKey(node.key)} onBlur={() => setHoverKey(null)} aria-label={`Open ticket ${node.label}, ${statusLabel[node.ticket!.status]}`} title={node.label}><i className={`graph-dot graph-dot-${node.ticket!.status}`} aria-hidden="true" /><span className="graph-node-name">{node.label}</span><ArrowUpRight size={13} aria-hidden="true" /></Link>)}
          {graph.people.map((node) => <button key={node.key} type="button" className={`graph-node graph-person${related(node) ? "" : " graph-node-muted"}${selectedKey === node.key ? " graph-node-selected" : ""}`} style={{ left: node.x, top: node.y }} onClick={() => focusNode(node.key)} onMouseEnter={() => setHoverKey(node.key)} onMouseLeave={() => setHoverKey(null)} onFocus={() => setHoverKey(node.key)} onBlur={() => setHoverKey(null)} aria-pressed={selectedKey === node.key} aria-label={`Focus ${node.label}, ${node.ticketIds.length} tickets`} title={node.label}><span className="graph-person-mark" aria-hidden="true">{node.label.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span><span className="graph-node-name">{node.label}<small>{node.ticketIds.length} {node.ticketIds.length === 1 ? "ticket" : "tickets"}</small></span></button>)}
        </div>
      </div>
      <aside className="ticket-graph-inspector" aria-label="Graph selection details">
        <div className="ticket-graph-inspector-top"><Network size={17} aria-hidden="true" /><span>{activeNode ? activeNode.kind === "workstream" ? "Workstream" : activeNode.kind === "person" ? "Person" : "Ticket" : "Explore the map"}</span>{selectedKey && <button type="button" aria-label="Clear graph selection" onClick={() => { setSelectedKey(null); setHoverKey(null); }}><X size={15} /></button>}</div>
        {activeNode ? <><h3>{activeNode.label}</h3><p>{activeNode.kind === "person" ? activeNode.role || "No roster assignment" : activeNode.kind === "workstream" ? "Workstream / project" : `${statusLabel[activeNode.ticket!.status]}${activeNode.ticket!.priority ? ` · ${activeNode.ticket!.priority} priority` : ""}`}</p><div className="ticket-graph-inspector-count"><strong>{connectedTickets.length}</strong><span>connected {connectedTickets.length === 1 ? "ticket" : "tickets"}</span></div><ul>{connectedTickets.map((node) => <li key={node.key}><Link href={`/dashboard/tickets/${node.ticket!.id}`}><i className={`graph-dot graph-dot-${node.ticket!.status}`} aria-hidden="true" /><span>{node.label}</span><ArrowUpRight size={13} aria-hidden="true" /></Link></li>)}</ul></> : <><h3>Follow the work.</h3><p>Select a node to see the tickets it connects to. Open a ticket to update its status, assignments or details.</p><div className="ticket-graph-inspector-count"><strong>{graph.tickets.length}</strong><span>tickets across {graph.workstreams.length} {graph.workstreams.length === 1 ? "workstream" : "workstreams"}</span></div><p className="ticket-graph-swipe">On a smaller screen, swipe the graph sideways and scroll inside it to see every node.</p></>}
      </aside>
    </div>
    <p className="ticket-graph-note">Lines show workstream membership and roster assignments already recorded for each ticket. They do not imply task dependencies.</p>
  </section>;
}
