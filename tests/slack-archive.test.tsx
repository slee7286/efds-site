// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SlackMessageCard, SlackNav } from "../components/slack/archive";

const message = {
  id: "message-1",
  channelId: "C1",
  channelName: "committee",
  slackTs: "1720000000.000100",
  threadTs: null,
  parentMessageId: null,
  authorUserId: "user-1",
  authorName: "EFDS officer",
  text: "Please review https://example.org before Friday.",
  subtype: null,
  sourcePostedAt: "2026-08-12T10:00:00Z",
  sourceEditedAt: null,
  permalink: "https://efds.slack.com/archives/C1/p1720000000000100",
  contentHash: "hash",
  isDeleted: false,
  firstSeenAt: "2026-08-12T10:01:00Z",
  lastSeenAt: "2026-08-12T10:01:00Z",
  lastChangedAt: null,
  reactions: [{ name: "thumbsup", slackUserId: "U1" }],
  links: [{ url: "https://example.org", domain: "example.org" }],
  files: [],
};

describe("private Slack archive surface", () => {
  it("renders source message provenance and admin navigation", () => {
    const { container } = render(<><SlackNav /><SlackMessageCard message={message} /></>);
    expect(container.textContent).toContain("EFDS officer");
    expect(container.textContent).toContain("1 reactions");
    expect(container.querySelector('a[href="/admin/slack/messages/message-1"]')).not.toBeNull();
    expect(container.querySelector('a[href="/admin/slack"]')).not.toBeNull();
  });

  it("does not expose a Slack credential in the rendered archive", () => {
    const { container } = render(<SlackMessageCard message={message} />);
    expect(container.textContent).not.toMatch(/SLACK_BOT_TOKEN|xoxb-/i);
  });
});
