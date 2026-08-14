// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MeetingSummary, MeetingTranscript, MeetingTable } from "../components/meetings/archive";

const item = {
  id: "meeting-1", title: "Committee meeting", externalMeetingId: "m1", meetingType: null,
  startedAt: "2026-08-01T10:00:00Z", endedAt: null, durationSeconds: 120, sourceType: "meetily", status: "active",
  sourceCreatedAt: "2026-08-01T10:00:00Z", sourceUpdatedAt: null, firstSeenAt: null, lastSeenAt: null, lastChangedAt: null,
  isMissing: false, transcriptAvailable: true, summaryAvailable: true,
};

describe("private Meetily archive", () => {
  it("renders meeting status and links to the admin detail page", () => {
    const { container } = render(<MeetingTable items={[item]} />);
    expect(container.textContent).toContain("Committee meeting");
    expect(container.textContent).toContain("available");
    expect(container.querySelector('a[href="/admin/meetings/meeting-1"]')).not.toBeNull();
  });

  it("renders timestamped transcript segments and preserves unknown speakers", () => {
    const { container } = render(<MeetingTranscript segments={[{ id: "segment-1", artifactId: "artifact-1", sequence: 0, startMs: 12000, endMs: null, speaker: null, text: "Welcome" }]} />);
    expect(container.textContent).toContain("00:00:12");
    expect(container.textContent).toContain("Speaker not identified");
    expect(container.textContent).toContain("Welcome");
  });

  it("labels the Meetily summary as AI-generated and not approved minutes", () => {
    const { container } = render(<MeetingSummary artifact={{ id: "artifact-1", artifactType: "summary", sourceRecordId: "m1", sourceReference: null, content: "Discussed plans", contentHash: "hash", format: "json", sourceCreatedAt: null, sourceUpdatedAt: null, ingestedAt: null, isCurrent: true, generatedBy: "meetily", reviewStatus: "source_generated", summaryTemplate: null }} />);
    expect(container.textContent).toContain("AI-generated Meetily summary");
    expect(container.textContent).toContain("not committee-approved minutes");
  });
});
