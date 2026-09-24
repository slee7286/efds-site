import "server-only";

import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildTicketTimeline, type CommitteeTicketChange, type SlackTicketMessage, type SlackTicketReaction, type TicketTimeline } from "@/lib/tickets/activity";

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
type Client = Awaited<ReturnType<typeof createServerSupabaseClient>>;
const fields = "id,title,description,workstream,priority,due_at,due_text,execution_status,review_version,created_at,updated_at,owner_text,metadata";
const activeStatuses = new Set<TicketStatus>(["open", "in_progress", "blocked"]);

function string(value: unknown): string { return typeof value === "string" ? value : ""; }
function optional(value: unknown): string | null { return typeof value === "string" && value.length > 0 ? value : null; }
function ticketStatus(value: unknown): TicketStatus {
  return ["open", "in_progress", "blocked", "completed", "cancelled"].includes(string(value)) ? value as TicketStatus : "open";
}

async function allTicketChannelMessages(supabase: Client, channelId: string) {
  const rows: Row[] = [];
  // Read the archive in pages so older thread updates remain in the dated log.
  for (let offset = 0; offset < 10000; offset += 1000) {
    const result = await supabase.from("slack_messages")
      .select("id,slack_ts,thread_ts,message_text,source_posted_at,author_user_id,user_slack_id,is_deleted")
      .eq("channel_id", channelId).order("source_posted_at").range(offset, offset + 999);
    if (result.error) throw result.error;
    rows.push(...(result.data ?? []));
    if ((result.data ?? []).length < 1000) break;
  }
  return rows;
}

async function getTicketActivityData(supabase: Client, tickets: Ticket[], officers: TicketOfficer[]) {
  const timelines = new Map<string, TicketTimeline>();
  if (!tickets.length) return { timelines, slackSyncedAt: null as string | null };
  const [channelResult, historyResult, usersResult] = await Promise.all([
    supabase.from("slack_channels").select("id").eq("name", "actions-tickets").eq("is_private", false).maybeSingle(),
    supabase.rpc("committee_ticket_history", { p_ticket_id: null }),
    supabase.from("slack_users").select("id,slack_user_id,display_name,real_name"),
  ]);
  if (channelResult.error) throw channelResult.error;
  if (historyResult.error) throw historyResult.error;
  if (usersResult.error) throw usersResult.error;
  const channelId = channelResult.data?.id;
  const [messagesResult, syncResult, mentionsResult] = await Promise.all([
    channelId ? allTicketChannelMessages(supabase, channelId) : Promise.resolve([] as Row[]),
    channelId ? supabase.from("slack_channel_sync_settings").select("last_successful_sync_at").eq("channel_id", channelId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    channelId ? supabase.from("slack_messages")
      .select("id,slack_ts,thread_ts,message_text,source_posted_at,author_user_id,user_slack_id,is_deleted")
      .neq("channel_id", channelId).ilike("message_text", "%ACTION-%")
      .order("source_posted_at", { ascending: false }).limit(1000) : Promise.resolve({ data: [] as Row[], error: null }),
  ]);
  if (syncResult.error) throw syncResult.error;
  if (mentionsResult.error) throw mentionsResult.error;
  const rows = [...messagesResult, ...(mentionsResult.data ?? [])];
  const messages: SlackTicketMessage[] = rows.filter((row) => optional(row.source_posted_at)).map((row) => ({
    id: string(row.id), slackTs: string(row.slack_ts), threadTs: optional(row.thread_ts), text: string(row.message_text),
    postedAt: string(row.source_posted_at), authorId: optional(row.author_user_id), userSlackId: optional(row.user_slack_id),
    isDeleted: row.is_deleted === true,
  }));
  const users = new Map<string, string>();
  for (const row of usersResult.data ?? []) {
    const name = optional(row.real_name) ?? optional(row.display_name) ?? string(row.slack_user_id);
    users.set(string(row.id), name);
    users.set(string(row.slack_user_id), name);
  }
  const sourceIds = new Set(tickets.map((ticket) => ticket.sourceMessageId).filter(Boolean));
  const reactionIds = messages.filter((message) => sourceIds.has(message.id)
    || message.text.startsWith("[EFDS archive repost:")).map((message) => message.id);
  const reactions: SlackTicketReaction[] = [];
  for (let offset = 0; offset < reactionIds.length; offset += 100) {
    const result = await supabase.from("slack_reactions").select("message_id,name,slack_user_id,first_seen_at")
      .in("message_id", reactionIds.slice(offset, offset + 100));
    if (result.error) throw result.error;
    for (const row of result.data ?? []) reactions.push({
      messageId: string(row.message_id), name: string(row.name), slackUserId: string(row.slack_user_id), firstSeenAt: string(row.first_seen_at),
    });
  }
  const changes: CommitteeTicketChange[] = (historyResult.data ?? []).map((row: Row) => ({
    id: string(row.event_id), ticketId: string(row.ticket_id), action: string(row.action),
    actorName: string(row.actor_name), changes: row.changes && typeof row.changes === "object" ? row.changes as Row : {},
    occurredAt: string(row.occurred_at),
  }));
  for (const ticket of tickets) timelines.set(ticket.id, buildTicketTimeline(ticket, messages, reactions, users, changes, officers));
  return { timelines, slackSyncedAt: optional(syncResult.data?.last_successful_sync_at) };
}

export async function getTicketWorkspace() {
  if (!isSupabaseConfigured) return { tickets: [] as Ticket[], officers: [] as TicketOfficer[], timelines: new Map<string, TicketTimeline>(), slackSyncedAt: null as string | null };
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
  return { tickets, officers, ...(await getTicketActivityData(supabase, tickets, officers)) };
}

export async function getOutlookSyncStatus(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("outlook_sync_checkpoints")
    .select("last_successful_at").order("last_successful_at", { ascending: false }).limit(1);
  if (error) return null;
  return optional(data?.[0]?.last_successful_at);
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
