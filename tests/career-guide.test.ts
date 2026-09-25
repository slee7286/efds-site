import { describe, expect, it } from "vitest";
import { companyGuide, getGuideCompany, guideTopics } from "@/lib/careers/company-guide";

describe("published company research", () => {
  it("includes every reviewed public brief with topic coverage and source links", () => {
    expect(companyGuide.companies).toHaveLength(192);
    expect(companyGuide.companies.reduce((sum, company) => sum + company.findings.length, 0)).toBe(2453);
    expect(getGuideCompany(companyGuide.companies[0].id)).toEqual(companyGuide.companies[0]);
    const topics = new Set(guideTopics.map(([topic]) => topic));
    for (const company of companyGuide.companies) {
      expect(company.findings.length).toBeGreaterThan(0);
      for (const finding of company.findings) {
        expect(topics.has(finding.topic as typeof guideTopics[number][0])).toBe(true);
        expect(finding.citations.length).toBeGreaterThan(0);
        expect(finding.citations.every((citation) => citation.url.startsWith("https://") || citation.url.startsWith("http://"))).toBe(true);
        expect(new Set(finding.citations.map((citation) => citation.url)).size).toBe(finding.citations.length);
      }
    }
  });

  it("publishes no applicant details, reviewer notes, or university email addresses", () => {
    const text = JSON.stringify(companyGuide);
    // `"reviewer"` (quoted) targets the metadata field rather than the English
    // word: the research legitimately describes a company's "document
    // reviewers" on a procurement lot, and that is not reviewer metadata.
    expect(text).not.toMatch(/siheon|lee25@|@(?:ic|imperial)\.ac\.uk|"reviewer"|review_note|model_usage|applicant_context|trackr/i);
  });
});
