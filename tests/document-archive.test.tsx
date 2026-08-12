// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DocumentTable } from "../components/documents/archive";

const item = {
  id: "document-1",
  title: "Officer handover",
  documentType: "document",
  sourceType: "onedrive_filesystem",
  sourceRoot: "C:\\Users\\private-root",
  relativePath: "03_Committee/Officer handover.docx",
  sourceArea: "03_committee",
  mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  extension: ".docx",
  fileSizeBytes: 100,
  contentHash: "abc",
  extractionStatus: "extracted",
  extractionError: null,
  isMissing: false,
  isUnavailable: false,
  firstSeenAt: "2026-08-12T10:00:00Z",
  lastSeenAt: "2026-08-12T10:00:00Z",
  lastSyncedAt: "2026-08-12T10:00:00Z",
  lastChangedAt: null,
  filesystemModifiedAt: "2026-08-12T10:00:00Z",
  duplicateCount: 2,
};

describe("private document archive", () => {
  it("renders relative source provenance and duplicate status", () => {
    const { container } = render(<DocumentTable items={[item]} />);
    expect(container.textContent).toContain("03_Committee/Officer handover.docx");
    expect(container.textContent).toContain("2 copies");
    expect(container.textContent).not.toContain("C:\\Users\\private-root");
  });

  it("does not render extracted secrets or credentials", () => {
    const { container } = render(<DocumentTable items={[item]} />);
    expect(container.textContent).not.toMatch(/SLACK_BOT_TOKEN|DATABASE_URL|xoxb-|SUPABASE_SERVICE_ROLE_KEY/i);
  });
});
