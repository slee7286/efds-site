// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EvidenceList, OperationsTable, ReviewTimeline } from "../components/operations/archive";

const record = {
  id: "record-1", recordType: "action_item" as const, title: "Contact the speaker", description: "Confirm availability.",
  priority: null, ownerProfileId: null, ownerOfficerId: null, ownerText: "Events team", dueAt: null, dueText: "Before Friday",
  occurredAt: null, workstream: "events", executionStatus: "open" as const, reviewStatus: "approved" as const, visibility: "internal" as const,
  isCurrent: true, reviewVersion: 2, createdAt: null, updatedAt: null, reviewedAt: null, completedAt: null, resolvedAt: null, supersededById: null,
};

describe("operational truth console", () => {
  it("renders action ownership and review state", () => {
    const { container } = render(<OperationsTable items={[record]} />);
    expect(container.textContent).toContain("Contact the speaker");
    expect(container.textContent).toContain("Events team");
    expect(container.textContent).toContain("approved");
  });

  it("renders evidence without replacing the source record", () => {
    const { container } = render(<EvidenceList record={record} evidence={[{ id: "e1", retrievalUnitId: "u1", sourceType: "slack_message", sourceRecordId: "m1", sourceVersionId: null, title: "#events", evidenceText: "We agreed to contact the speaker.", evidenceRole: "supporting", createdAt: null }]} />);
    expect(container.textContent).toContain("#events");
    expect(container.textContent).toContain("Source references, not copied truth");
  });

  it("renders transactional review history", () => {
    const { container } = render(<ReviewTimeline events={[{ id: "event-1", action: "approved", previousReviewStatus: "proposed", newReviewStatus: "approved", reviewerProfileId: "profile-1", reason: null, changes: {}, createdAt: "2026-08-14T10:00:00Z" }]} />);
    expect(container.textContent).toContain("approved");
    expect(container.textContent).toContain("proposed");
  });
});
