import { describe, expect, it } from "vitest";
import { buildTicketTimeline, inferSlackStatus, type CommitteeTicketChange, type SlackTicketMessage } from "@/lib/tickets/activity";
import type { Ticket } from "@/lib/db/tickets";

const ticket: Ticket = {
  id: "ticket-1", title: "ACTION-023 — Confirm training", description: null, workstream: "Operations", priority: "high",
  dueAt: null, dueText: null, status: "open", reviewVersion: 1, createdAt: "2026-09-22T15:00:00Z",
  updatedAt: "2026-09-22T15:00:00Z", ownerText: null, sourceMessageId: "root-23", assignees: [],
};
const root: SlackTicketMessage = {
  id: "root-23", slackTs: "1790086879.802589", threadTs: null, text: "ACTION-023 — Confirm training\nDefinition of done: all quizzes reported",
  postedAt: "2026-09-22T14:21:19Z", authorId: "user-1", userSlackId: "U1", isDeleted: false,
};
const users = new Map([["user-1", "Siheon"], ["U1", "Siheon"], ["user-2", "Katia"], ["U2", "Katia"]]);

function reply(id: string, text: string, postedAt: string): SlackTicketMessage {
  return { id, slackTs: id, threadTs: root.slackTs, text, postedAt, authorId: "user-2", userSlackId: "U2", isDeleted: false };
}

describe("ticket activity", () => {
  it("classifies explicit progress while avoiding negated completion", () => {
    expect(inferSlackStatus("I'm blocked waiting for ICU access")).toBe("blocked");
    expect(inferSlackStatus("I finished the assigned quizzes")).toBe("completed");
    expect(inferSlackStatus("I'm working on the list")).toBe("in_progress");
    expect(inferSlackStatus("Not completed yet")).toBeNull();
    expect(inferSlackStatus("Not completed yet, but I'm working on it")).toBe("in_progress");
    expect(inferSlackStatus("This should be completed next week")).toBeNull();
    expect(inferSlackStatus("Definition of done: confirm access")).toBeNull();
  });

  it("links a dated reply to its Slack author and proposes review of changed status", () => {
    const result = buildTicketTimeline(ticket, [root, reply("reply-1", "I'm working on my assigned quizzes", "2026-09-23T10:00:00Z")], [], users, [], []);
    expect(result.suggestion?.inferredStatus).toBe("in_progress");
    expect(result.activity[0]).toMatchObject({ actor: "Katia", at: "2026-09-23T10:00:00Z", sourceMessageId: "reply-1" });
    expect(result.activity[1]).toMatchObject({ actor: "Siheon", action: "Created ticket in Slack" });
  });

  it("uses the newest signal and does not revive a superseded suggestion", () => {
    const result = buildTicketTimeline(ticket, [root,
      reply("reply-1", "I'm blocked waiting for access", "2026-09-23T10:00:00Z"),
      reply("reply-2", "This remains open; no work has started", "2026-09-23T11:00:00Z"),
    ], [{ messageId: "root-23", name: "x", slackUserId: "U1", firstSeenAt: "2026-09-23T12:00:00Z" }], users, [], []);
    expect(result.suggestion).toBeNull();
  });

  it("withdraws an older completion suggestion when a newer update says it is unfinished", () => {
    const result = buildTicketTimeline(ticket, [root,
      reply("reply-1", "Done", "2026-09-23T10:00:00Z"),
      reply("reply-2", "Not completed yet", "2026-09-23T11:00:00Z"),
    ], [], users, [], []);
    expect(result.suggestion).toBeNull();
  });

  it("shows reaction observation dates honestly and does not regress after committee confirmation", () => {
    const changes: CommitteeTicketChange[] = [{ id: "change-1", ticketId: ticket.id, action: "committee_status", actorName: "Katia", changes: { execution_status: "completed" }, occurredAt: "2026-09-23T13:00:00Z" }];
    const result = buildTicketTimeline({ ...ticket, status: "completed" }, [root, reply("reply-1", "Done", "2026-09-23T10:00:00Z")],
      [{ messageId: "root-23", name: "white_check_mark", slackUserId: "U2", firstSeenAt: "2026-09-23T12:00:00Z" }], users, changes, []);
    expect(result.suggestion).toBeNull();
    expect(result.activity.find((entry) => entry.id.startsWith("reaction:"))).toMatchObject({ actor: "Katia", observedOnly: true });
    expect(result.activity[0]).toMatchObject({ actor: "Katia", action: "Set status to completed" });
  });

  it("ignores another ticket root even if its description names this action", () => {
    const other: SlackTicketMessage = { ...root, id: "root-24", slackTs: "another", text: "ACTION-024 — Other work\nComplete ACTION-023 first", postedAt: "2026-09-23T16:00:00Z" };
    const result = buildTicketTimeline(ticket, [root, other], [], users, [], []);
    expect(result.activity).toHaveLength(1);
  });

  it("does not propose reopening when a completion check remains on the ticket", () => {
    const result = buildTicketTimeline({ ...ticket, status: "completed" }, [root], [
      { messageId: root.id, name: "white_check_mark", slackUserId: "U1", firstSeenAt: "2026-09-23T09:00:00Z" },
      { messageId: root.id, name: "x", slackUserId: "U2", firstSeenAt: "2026-09-23T10:00:00Z" },
    ], users, [], []);
    expect(result.suggestion).toBeNull();
  });
});
