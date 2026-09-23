import "server-only";

import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TicketStatus = "open" | "in_progress" | "blocked" | "completed" | "cancelled";
export type TicketOfficer = { id: string; name: string; role: string };
export type Ticket = {
  id: string;
  title: string;
  description: string | null;
  workstream: string | null;
  priority: string | null;
  dueAt: string | null;
  dueText: string | null;
  status: TicketStatus;
  reviewVersion: number;
  createdAt: string;
  updatedAt: string;
  ownerText: string | null;
  sourceMessageId: string | null;
  assignees: TicketOfficer[];
};

type Row = Record<string, unknown>;
const fields = "id,title,description,workstream,priority,due_at,due_text,execution_status,review_version,created_at,updated_at,owner_text,metadata";
const activeStatuses = new Set<TicketStatus>(["open", "in_progress", "blocked"]);

function string(value: unknown): string { return typeof value === "string" ? value : ""; }
function optional(value: unknown): string | null { return typeof value === "string" && value.length > 0 ? value : null; }
function ticketStatus(value: unknown): TicketStatus {
  return ["open", "in_progress", "blocked", "completed", "cancelled"].includes(string(value)) ? value as TicketStatus : "open";
}

export async function getTicketWorkspace() {
  if (!isSupabaseConfigured) return { tickets: [] as Ticket[], officers: [] as TicketOfficer[] };
  await requireRole("committee");
  const supabase = await createServerSupabaseClient();
  const [ticketsResult, officersResult, assignmentsResult] = await Promise.all([
    supabase.from("operational_records").select(fields).eq("record_type", "action_item").eq("review_status", "approved").eq("visibility", "committee").eq("is_current", true).order("updated_at", { ascending: false }).limit(500),
    supabase.from("officers").select("id,name,role").eq("active", true).order("name"),
    supabase.from("operational_ticket_assignees").select("ticket_id,officer_id"),
  ]);
  if (ticketsResult.error) throw ticketsResult.error;
  if (officersResult.error) throw officersResult.error;
  if (assignmentsResult.error) throw assignmentsResult.error;
  const officers: TicketOfficer[] = (officersResult.data ?? []).map((row: Row) => ({ id: string(row.id), name: string(row.name), role: string(row.role) }));
  const officerMap = new Map(officers.map((officer) => [officer.id, officer]));
  const assignments = new Map<string, TicketOfficer[]>();
  for (const row of assignmentsResult.data ?? []) {
    const officer = officerMap.get(string(row.officer_id));
    if (officer) assignments.set(string(row.ticket_id), [...(assignments.get(string(row.ticket_id)) ?? []), officer]);
  }
  const tickets: Ticket[] = (ticketsResult.data ?? []).map((row: Row) => {
    const metadata = row.metadata && typeof row.metadata === "object" ? row.metadata as Row : {};
    return {
      id: string(row.id), title: string(row.title), description: optional(row.description), workstream: optional(row.workstream),
      priority: optional(row.priority), dueAt: optional(row.due_at), dueText: optional(row.due_text), status: ticketStatus(row.execution_status),
      reviewVersion: Number(row.review_version ?? 1), createdAt: string(row.created_at), updatedAt: string(row.updated_at),
      ownerText: optional(row.owner_text), sourceMessageId: optional(metadata.slack_message_id), assignees: assignments.get(string(row.id)) ?? [],
    };
  });
  return { tickets, officers };
}

export function ticketCounts(tickets: Ticket[]) {
  const now = Date.now();
  return {
    total: tickets.length,
    left: tickets.filter((ticket) => activeStatuses.has(ticket.status)).length,
    open: tickets.filter((ticket) => ticket.status === "open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    blocked: tickets.filter((ticket) => ticket.status === "blocked").length,
    completed: tickets.filter((ticket) => ticket.status === "completed").length,
    overdue: tickets.filter((ticket) => ticket.dueAt && Date.parse(ticket.dueAt) < now && activeStatuses.has(ticket.status)).length,
    unassigned: tickets.filter((ticket) => ticket.assignees.length === 0 && !ticket.ownerText).length,
  };
}
