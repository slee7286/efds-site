// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/server", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));
import { selectRecapMessages } from "@/lib/db/slack-recap";
import { DailySlackRecap } from "@/components/slack/daily-recap";

describe("daily Slack recap", () => {
  it("limits excerpts, excludes hidden channels and reposts, and cleans Slack link syntax", () => {
    const rows = [
      { id: "hidden", channel_id: "private", message_text: "Private", source_posted_at: "2026-09-23T09:00:00Z" },
      ...["[EFDS archive repost: ticket]", "Read <https://example.com|the notes>", "Second", "Third"].map((text, i) => ({ id: String(i), channel_id: "events", message_text: text, source_posted_at: "2026-09-23T09:00:00Z" })),
      { id: "finance", channel_id: "finance", message_text: "Budget approved", source_posted_at: "2026-09-23T09:00:00Z" },
    ];
    const result = selectRecapMessages(rows, new Map([["events", "events"], ["finance", "finance"]]));
    expect(result.map((item) => item.text)).toEqual(["Read the notes", "Second", "Budget approved"]);
  });
  it("starts collapsed and preserves access to the archive during a recap failure", () => {
    const { container } = render(<DailySlackRecap basePath="/dashboard/slack" recap={{ unavailable: true, messageCount: 0, enabledChannels: 0, lastCompleteSyncAt: null, stale: true, messages: [] }} />);
    expect(container.querySelector("details")?.open).toBe(false);
    expect(screen.getByText(/Temporarily unavailable/)).toBeTruthy();
    expect(screen.queryByText("Sync needs attention")).toBeNull();
    expect(container.querySelector('a')?.getAttribute("href")).toBe("/dashboard/slack");
  });
});
