// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnifiedSearch } from "../components/search/unified-search";

const result = {
  retrievalUnitId: "unit-1", sourceType: "knowledge_requirement" as const, sourceRecordId: "req-1",
  sourceParentId: "article-1", sourceVersionId: "hash-1", title: "External speaker approval",
  snippet: "Complete <mark>external speaker</mark> approval before confirming.", score: 1,
  sourceArea: "events", topic: null, channel: null, author: null, occurredAt: null,
  sourceUpdatedAt: null, reviewStatus: "approved", visibility: "member" as const, isCurrent: true,
  isStale: false, sourceUrl: null, permalink: null, relativePath: null, contentHash: "hash", metadata: {},
};

describe("unified search result surface", () => {
  it("renders source labels, safe snippets, and the source filter", () => {
    const { container } = render(<UnifiedSearch results={[result]} query="speaker" admin={false} source="" />);
    expect(container.textContent).toContain("Requirement");
    expect(container.textContent).toContain("external speaker");
    expect(container.querySelector("select[name=source]")).not.toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });
});
