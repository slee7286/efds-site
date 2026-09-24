"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Network, X } from "lucide-react";
import { statusLabel } from "@/components/tickets/ticket-card";
import { buildTicketGraph, type GraphNode, type GraphTicket } from "@/lib/tickets/graph";

function pathBetween(from: GraphNode, to: GraphNode) {
  const startX = from.kind === "workstream" ? from.x + 159 : from.x + 256;
  const endX = to.x;
  const bend = (endX - startX) * 0.48;
  return `M ${startX} ${from.y} C ${startX + bend} ${from.y}, ${endX - bend} ${to.y}, ${endX} ${to.y}`;
}

export function TicketGraph({ tickets }: { tickets: GraphTicket[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const peopleRail = useRef<HTMLDivElement>(null);
  const personButtons = useRef(new Map<string, HTMLButtonElement>());
  const [personAnchors, setPersonAnchors] = useState<Record<string, { x: number; y: number }>>({});
  const [expandedWorkstreams, setExpandedWorkstreams] = useState<Set<string>>(() => new Set());
  const completedByWorkstream = useMemo(() => {
    const groups = new Map<string, number>();
    for (const ticket of tickets) if (ticket.status === "completed") {
      const name = ticket.workstream?.trim() || "Unsorted";
      groups.set(name, (groups.get(name) ?? 0) + 1);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [tickets]);
  const visibleTickets = useMemo(() => tickets.filter((ticket) => ticket.status !== "completed" || expandedWorkstreams.has(ticket.workstream?.trim() || "Unsorted")), [tickets, expandedWorkstreams]);
  const graph = useMemo(() => buildTicketGraph(visibleTickets), [visibleTickets]);
  const nodes = useMemo(() => [...graph.workstreams, ...graph.tickets, ...graph.people], [graph]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const activeKey = hoverKey ?? selectedKey;
  const activeNode = nodes.find((node) => node.key === activeKey);
  const activeTicketIds = new Set(activeNode?.ticketIds ?? []);
  const related = (node: GraphNode) => !activeNode || node.ticketIds.some((id) => activeTicketIds.has(id));
  const connectedTickets = activeNode ? graph.tickets.filter((node) => activeTicketIds.has(node.ticket!.id)) : [];
  const visibleEdges = graph.edges.filter((edge) => {
    if (!activeNode) return edge.kind === "workstream";
    if (!activeTicketIds.has(edge.ticketId)) return false;
    if (edge.kind === "workstream") return true;
    return activeNode.kind === "ticket" ? edge.from.key === activeNode.key : activeNode.kind === "person" && edge.to.key === activeNode.key;
  });
  const positionPeople = useCallback(() => {
    const view = viewport.current;
    if (!view) return;
    const viewRect = view.getBoundingClientRect();
    const anchors: Record<string, { x: number; y: number }> = {};
    for (const [key, button] of personButtons.current) {
      const rect = button.getBoundingClientRect();
      anchors[key] = {
        x: view.scrollLeft + rect.left - viewRect.left,
        y: view.scrollTop + rect.top + rect.height / 2 - viewRect.top,
      };
    }
    setPersonAnchors(anchors);
  }, []);

  useLayoutEffect(() => {
    positionPeople();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(positionPeople);
    if (viewport.current) observer.observe(viewport.current);
    if (peopleRail.current) observer.observe(peopleRail.current);
    return () => observer.disconnect();
  }, [graph, positionPeople]);

  function focusNode(key: string) {
    setSelectedKey((current) => current === key ? null : key);
    setHoverKey(null);
  }

  if (!tickets.length) return <section className="ticket-graph ticket-graph-empty" aria-label="Committee relationship map"><div className="ticket-graph-heading"><div><span className="eyebrow">Committee relationship map</span><h2>No active relationships yet.</h2><p>New active tickets and their assignments will appear here.</p></div></div><Link className="text-link" href="/dashboard/tickets/new">Create a ticket <ArrowUpRight size={15} /></Link></section>;

  return <section className="ticket-graph" aria-labelledby="ticket-graph-heading">
    <div className="ticket-graph-heading">
      <div><span className="eyebrow">Committee relationship map</span><h2 id="ticket-graph-heading">Projects, tickets, people.</h2><p>Choose a person to reveal assignments, or a workstream to focus its tickets. Open any ticket for details.</p></div>
      <div className="ticket-graph-key" aria-label="Ticket status key"><span><i className="graph-dot graph-dot-blocked" /> Blocked</span><span><i className="graph-dot graph-dot-in_progress" /> In progress</span><span><i className="graph-dot graph-dot-open" /> Open</span><span><i className="graph-dot graph-dot-completed" /> Completed</span><span><i className="graph-dot graph-dot-cancelled" /> Cancelled</span></div>
    </div>
    {completedByWorkstream.length > 0 && <div className="ticket-graph-completed" aria-label="Completed tickets by workstream"><span>Completed by workstream</span>{completedByWorkstream.map(([name, count]) => <button key={name} type="button" aria-expanded={expandedWorkstreams.has(name)} onClick={() => { setSelectedKey(null); setHoverKey(null); setExpandedWorkstreams((current) => { const next = new Set(current); if (next.has(name)) next.delete(name); else next.add(name); return next; }); }}>{expandedWorkstreams.has(name) ? "Hide" : "Show"} {count} completed in {name}</button>)}</div>}
    <div className="ticket-graph-jumps" aria-label="Move through graph columns"><span>Jump to</span><button type="button" onClick={() => viewport.current?.scrollTo({ left: 0 })}>Workstreams</button><button type="button" onClick={() => viewport.current?.scrollTo({ left: 190 })}>Tickets</button><button type="button" onClick={() => viewport.current?.scrollTo({ left: graph.width })}>People</button></div>
    <div className="ticket-graph-layout">
      <div ref={viewport} className="ticket-graph-viewport" role="region" aria-label="Interactive ticket graph; scroll to explore" tabIndex={0} onScroll={positionPeople}>
        <div className="ticket-graph-canvas" style={{ width: graph.width, height: graph.height }}>
          <div className="ticket-graph-axis ticket-graph-axis-workstreams">01 / Workstreams</div>
          <div className="ticket-graph-axis ticket-graph-axis-tickets">02 / Tickets</div>
          {graph.tickets.length === 0 && <p className="ticket-graph-empty-note">All matching tickets are completed. Expand a workstream above to see them.</p>}
          {graph.clusters.map((cluster) => <div className="ticket-graph-cluster" key={cluster.key} style={{ top: cluster.top, height: cluster.height }} aria-hidden="true" />)}
          <svg className="ticket-graph-lines" width={graph.width} height={graph.height} viewBox={`0 0 ${graph.width} ${graph.height}`} aria-hidden="true" focusable="false">
            {visibleEdges.map((edge) => <path key={edge.key} d={pathBetween(edge.from, edge.to.kind === "person" ? { ...edge.to, ...personAnchors[edge.to.key] } : edge.to)} className={activeNode ? "graph-line graph-line-active" : "graph-line"} />)}
          </svg>
          {graph.workstreams.map((node) => <button key={node.key} type="button" className={`graph-node graph-workstream${related(node) ? "" : " graph-node-muted"}${selectedKey === node.key ? " graph-node-selected" : ""}`} style={{ left: node.x, top: node.y }} onClick={() => focusNode(node.key)} onMouseEnter={() => setHoverKey(node.key)} onMouseLeave={() => setHoverKey(null)} onFocus={() => setHoverKey(node.key)} onBlur={() => setHoverKey(null)} aria-pressed={selectedKey === node.key} aria-label={`Focus workstream ${node.label}, ${node.ticketIds.length} tickets`} title={node.label}><span className="graph-node-name">{node.label}</span><span className="graph-node-count">{node.ticketIds.length}</span></button>)}
          {graph.tickets.map((node) => <Link key={node.key} className={`graph-node graph-ticket graph-ticket-${node.ticket!.status}${related(node) ? "" : " graph-node-muted"}`} style={{ left: node.x, top: node.y }} href={`/dashboard/tickets/${node.ticket!.id}`} prefetch={false} onMouseEnter={() => setHoverKey(node.key)} onMouseLeave={() => setHoverKey(null)} onFocus={() => setHoverKey(node.key)} onBlur={() => setHoverKey(null)} aria-label={`Open ticket ${node.label}, ${statusLabel[node.ticket!.status]}`} title={node.label}><i className={`graph-dot graph-dot-${node.ticket!.status}`} aria-hidden="true" /><span className="graph-node-name">{node.label}</span><ArrowUpRight size={13} aria-hidden="true" /></Link>)}
          <div className="ticket-graph-people-frame"><div ref={peopleRail} className="ticket-graph-people-rail" onScroll={positionPeople}><div className="ticket-graph-people-heading">03 / People <span>{graph.people.length}</span></div>{graph.people.map((node) => <button key={node.key} ref={(button) => { if (button) personButtons.current.set(node.key, button); else personButtons.current.delete(node.key); }} type="button" className={`graph-node graph-person${related(node) ? "" : " graph-node-muted"}${selectedKey === node.key ? " graph-node-selected" : ""}`} onClick={() => focusNode(node.key)} onMouseEnter={() => setHoverKey(node.key)} onMouseLeave={() => setHoverKey(null)} onFocus={() => setHoverKey(node.key)} onBlur={() => setHoverKey(null)} aria-pressed={selectedKey === node.key} aria-label={`Focus ${node.label}, ${node.ticketIds.length} tickets`} title={node.label}><span className="graph-person-mark" aria-hidden="true">{node.label.split(/\s+/).map((part) => part[0]).slice(0, 2).join("")}</span><span className="graph-node-name">{node.label}<small>{node.ticketIds.length} {node.ticketIds.length === 1 ? "ticket" : "tickets"}</small></span></button>)}</div></div>
        </div>
      </div>
      <aside className="ticket-graph-inspector" aria-label="Graph selection details">
        <div className="ticket-graph-inspector-top"><Network size={17} aria-hidden="true" /><span>{activeNode ? activeNode.kind === "workstream" ? "Workstream" : activeNode.kind === "person" ? "Person" : "Ticket" : "Explore the map"}</span>{selectedKey && <button type="button" aria-label="Clear graph selection" onClick={() => { setSelectedKey(null); setHoverKey(null); }}><X size={15} /></button>}</div>
        {activeNode ? <><h3>{activeNode.label}</h3><p>{activeNode.kind === "person" ? activeNode.role || "No roster assignment" : activeNode.kind === "workstream" ? "Workstream / project" : `${statusLabel[activeNode.ticket!.status]}${activeNode.ticket!.priority ? ` · ${activeNode.ticket!.priority} priority` : ""}`}</p><div className="ticket-graph-inspector-count"><strong>{connectedTickets.length}</strong><span>connected {connectedTickets.length === 1 ? "ticket" : "tickets"}</span></div><ul>{connectedTickets.map((node) => <li key={node.key}><Link href={`/dashboard/tickets/${node.ticket!.id}`}><i className={`graph-dot graph-dot-${node.ticket!.status}`} aria-hidden="true" /><span>{node.label}</span><ArrowUpRight size={13} aria-hidden="true" /></Link></li>)}</ul></> : <><h3>Follow the work.</h3><p>Select a node to see the tickets it connects to. Open a ticket to update its status, assignments or details.</p><div className="ticket-graph-inspector-count"><strong>{graph.tickets.length}</strong><span>visible tickets across {graph.workstreams.length} {graph.workstreams.length === 1 ? "workstream" : "workstreams"}</span></div><p className="ticket-graph-swipe">On a smaller screen, swipe the graph sideways and scroll inside it to see every node.</p></>}
      </aside>
    </div>
    <p className="ticket-graph-note">Workstream links are always visible. Select a person or ticket to reveal its recorded assignments. Lines do not imply task dependencies.</p>
  </section>;
}
