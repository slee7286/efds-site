import type { Ticket, TicketOfficer, TicketStatus } from "@/lib/db/tickets";

export type TicketActivity = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string | null;
  sourceMessageId: string | null;
  observedOnly: boolean;
  inferredStatus: TicketStatus | null;
};

export type SlackTicketMessage = {
  id: string;
  slackTs: string;
  threadTs: string | null;
  text: string;
  postedAt: string;
  authorId: string | null;
  userSlackId: string | null;
  isDeleted: boolean;
};

export type SlackTicketReaction = {
  messageId: string;
  name: string;
  slackUserId: string;
  firstSeenAt: string;
};

export type CommitteeTicketChange = {
  id: string;
  ticketId: string;
  action: string;
  actorName: string;
  changes: Record<string, unknown>;
  occurredAt: string;
};

export type TicketTimeline = { activity: TicketActivity[]; suggestion: TicketActivity | null; latestUpdate: TicketActivity | null };

const labels: Record<TicketStatus, string> = {
  open: "open", in_progress: "in progress", blocked: "blocked", completed: "completed", cancelled: "cancelled",
};

function negatesCompletion(text: string) {
  return /\b(?:not|isn't|aren't|wasn't|haven't|hasn't)\s+(?:yet\s+)?(?:done|complete|completed|finished|submitted|booked|confirmed)\b/i.test(text);
}

export function inferSlackStatus(text: string): TicketStatus | null {
  const normalized = text.toLowerCase().replace(/<[^>]+>/g, " ").replace(/\bdefinition of done\b/g, "");
  if (/\b(blocked|stuck|can't|cannot|unable to|waiting (?:for|on))\b/.test(normalized)) return "blocked";
  if (/\b(status:\s*open|(?:remains|still) open|not started|no work has started|hasn't started|haven't started)\b/.test(normalized)) return "open";
  if (negatesCompletion(normalized)) {
    return /\b(in progress|working on|started|underway|drafting|preparing)\b/.test(normalized) ? "in_progress" : null;
  }
  if (/\b(?:will|should|need to|to be|once|when)\s+(?:be\s+)?(?:done|complete|completed|finished)\b/.test(normalized)) return null;
  if (/\b(done|completed|finished|submitted|booked|confirmed)\b/.test(normalized)) return "completed";
  if (/\b(in progress|working on|started|underway|drafting|preparing)\b/.test(normalized)) return "in_progress";
  return null;
}

function changeAction(change: CommitteeTicketChange, officers: TicketOfficer[]): string {
  if (change.action === "committee_status") {
    const status = change.changes.execution_status;
    return typeof status === "string" && status in labels ? `Set status to ${labels[status as TicketStatus]}` : "Set ticket status";
  }
  if (change.action === "committee_assign") {
    const ids = Array.isArray(change.changes.assignee_ids) ? change.changes.assignee_ids : [];
    const names = ids.map((id) => officers.find((officer) => officer.id === id)?.name).filter(Boolean);
    if (!ids.length) return "Cleared assignments";
    return names.length === ids.length ? `Set assignees to ${names.join(", ")}` : `Set ${ids.length} assignees`;
  }
  if (change.action === "committee_create") return "Created ticket";
  if (change.action === "committee_progress_mode") return change.changes.enabled === true ? "Enabled individual progress" : "Returned to shared ticket progress";
  if (change.action === "committee_assignee_progress") {
    const officer = officers.find((item) => item.id === change.changes.officer_id);
    const status = change.changes.status;
    return `${officer?.name ?? "An assignee"}: ${typeof status === "string" && status in labels ? labels[status as TicketStatus] : "progress updated"}`;
  }
  if (change.action === "committee_reminder") {
    const count = Number(change.changes.recipient_count);
    return Number.isInteger(count) && count > 0
      ? `Requested reminder emails for ${count} ${count === 1 ? "account" : "accounts"}`
      : "Requested ticket reminders";
  }
  return "Saved ticket details";
}

export function buildTicketTimeline(
  ticket: Ticket,
  messages: SlackTicketMessage[],
  reactions: SlackTicketReaction[],
  users: Map<string, string>,
  changes: CommitteeTicketChange[],
  officers: TicketOfficer[],
): TicketTimeline {
  const activity: TicketActivity[] = [];
  const negativeCompletionIds = new Set<string>();
  const code = /\bACTION-\d{3}\b/i.exec(ticket.title)?.[0].toUpperCase() ?? null;
  const source = messages.find((message) => message.id === ticket.sourceMessageId && !message.isDeleted);
  const threadRoots = new Set<string>();
  if (source) {
    threadRoots.add(source.slackTs);
    activity.push({ id: `slack:${source.id}`, at: source.postedAt, actor: users.get(source.authorId ?? "") ?? source.userSlackId ?? "Slack member", action: "Created ticket in Slack", detail: null, sourceMessageId: source.id, observedOnly: false, inferredStatus: null });
  }
  if (code) for (const message of messages) {
    if (!message.isDeleted && message.text.startsWith(`[EFDS archive repost: ${code}]`)) threadRoots.add(message.slackTs);
  }

  const related = messages.filter((message) => {
    if (message.isDeleted || message.id === source?.id || !code || message.text.startsWith("[EFDS archive repost:")) return false;
    if (/^ACTION-\d{3}\b/i.test(message.text)) return false;
    return Boolean(message.threadTs && message.threadTs !== message.slackTs && threadRoots.has(message.threadTs))
      || new RegExp(`\\b${code}\\b`, "i").test(message.text);
  });
  for (const message of related) {
    const status = inferSlackStatus(message.text);
    if (negatesCompletion(message.text)) negativeCompletionIds.add(`slack:${message.id}`);
    activity.push({
      id: `slack:${message.id}`, at: message.postedAt,
      actor: users.get(message.authorId ?? "") ?? message.userSlackId ?? "Slack member",
      action: "Posted a Slack update", detail: message.text.trim().slice(0, 1200),
      sourceMessageId: message.id, observedOnly: false, inferredStatus: status,
    });
  }

  const reactionMessageIds = new Set([source?.id, ...messages.filter((message) => code && message.text.startsWith(`[EFDS archive repost: ${code}]`)).map((message) => message.id)].filter((id): id is string => Boolean(id)));
  const hasCompletionReaction = reactions.some((reaction) => reactionMessageIds.has(reaction.messageId) && reaction.name === "white_check_mark");
  for (const reaction of reactions) {
    if (!reactionMessageIds.has(reaction.messageId) || !["white_check_mark", "x"].includes(reaction.name)) continue;
    const complete = reaction.name === "white_check_mark";
    const reactionId = `reaction:${reaction.messageId}:${reaction.name}:${reaction.slackUserId}`;
    if (!complete && !hasCompletionReaction) negativeCompletionIds.add(reactionId);
    activity.push({
      id: reactionId,
      at: reaction.firstSeenAt, actor: users.get(reaction.slackUserId) ?? reaction.slackUserId,
      action: complete ? "Completion check visible in Slack" : "Unfinished X visible in Slack",
      detail: "Reaction date is when the archive first saw it; the exact reaction time is unavailable.",
      sourceMessageId: reaction.messageId, observedOnly: true,
      inferredStatus: complete ? "completed" : ticket.status === "completed" && !hasCompletionReaction ? "open" : null,
    });
  }

  const ticketChanges = changes.filter((change) => change.ticketId === ticket.id);
  for (const change of ticketChanges) {
    activity.push({
      id: `committee:${change.id}`, at: change.occurredAt, actor: change.actorName,
      action: changeAction(change, officers), detail: null, sourceMessageId: null,
      observedOnly: false, inferredStatus: null,
    });
  }
  activity.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));

  const latestStatusChange = ticketChanges.filter((change) => change.action === "committee_status")
    .map((change) => change.occurredAt).sort().at(-1) ?? ticket.createdAt;
  const latestSignal = activity.find((entry) => entry.inferredStatus && entry.at > latestStatusChange);
  const latestNoCompletion = activity.find((entry) => negativeCompletionIds.has(entry.id) && entry.at > latestStatusChange);
  const completionWithdrawn = latestSignal?.inferredStatus === "completed" && latestNoCompletion && latestNoCompletion.at > latestSignal.at;
  const suggestion = !completionWithdrawn && latestSignal?.inferredStatus !== ticket.status ? latestSignal ?? null : null;
  const latestUpdate = activity.find((entry) => entry.action === "Posted a Slack update") ?? null;
  return { activity, suggestion, latestUpdate };
}
