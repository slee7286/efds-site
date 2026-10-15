// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { CompanyBrief } from "@/components/careers/company-brief";
import { getGuideCompany, type CompanyGuide } from "@/lib/careers/company-guide";

afterEach(cleanup);

function fixture(): CompanyGuide {
  const company = getGuideCompany("optiver-3507fe20")!;
  const first = { title: "Business overview", publisher: "Employer", url: "https://example.org/business", retrievedAt: "2026-09-24" };
  const second = { title: "Regulated entity disclosure", publisher: "Regulator", url: "https://example.org/entity", retrievedAt: "2026-09-24" };
  return {
    ...company, roles: [], gaps: [], openQuestions: [],
    findings: [
      { id: "business-a", topic: "business", statement: "The group provides liquidity across several markets.", scope: "Global group, not a specific office", eventDate: null, citations: [first] },
      { id: "business-b", topic: "business", statement: "The regulated subsidiary is a separate legal entity.", scope: "UK subsidiary only", eventDate: "2025-03-31", citations: [second, first] },
      { id: "work-a", topic: "work", statement: "The historical example does not establish a current vacancy.", scope: "Historical project", eventDate: null, citations: [first] },
    ],
  };
}

describe("compact company briefs", () => {
  it("defaults the native Show sources toggle to off", () => {
    render(<CompanyBrief company={fixture()} backHref="/careers/guide" />);
    const toggle = screen.getByRole("checkbox", { name: "Show sources" });
    expect((toggle as HTMLInputElement).checked).toBe(false);
  });

  it("combines findings into topic paragraphs without dropping statements", () => {
    const company = fixture();
    const { container } = render(<CompanyBrief company={company} backHref="/careers/guide" />);
    const paragraphs = container.querySelectorAll(".career-guide-paragraph");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0].textContent).toContain(company.findings[0].statement);
    expect(paragraphs[0].textContent).toContain(company.findings[1].statement);
    for (const finding of company.findings) {
      expect(container.querySelector(`[data-finding-id="${finding.id}"]`)?.textContent).toContain(finding.statement);
    }
    expect(container.querySelectorAll("article.career-guide-finding")).toHaveLength(0);
  });

  it("numbers superscript citations once per source and reuses their numbers", () => {
    const { container } = render(<CompanyBrief company={fixture()} backHref="/careers/guide" />);
    const first = container.querySelector('[data-finding-id="business-a"]')!;
    const second = container.querySelector('[data-finding-id="business-b"]')!;
    const third = container.querySelector('[data-finding-id="work-a"]')!;
    expect([...first.querySelectorAll("sup a")].map((link) => link.textContent)).toEqual(["[1]"]);
    expect([...second.querySelectorAll("sup a")].map((link) => link.textContent)).toEqual(["[2]", "[1]"]);
    expect([...third.querySelectorAll("sup a")].map((link) => link.textContent)).toEqual(["[1]"]);
    for (const link of container.querySelectorAll<HTMLAnchorElement>("sup a")) {
      expect(link.target).toBe("_blank");
      expect(link.rel).toContain("noopener");
      expect(link.getAttribute("aria-label")).toMatch(/Source [12]:/);
    }
  });

  it("retains entity boundaries, per-finding scopes and dates in expandable context", () => {
    const company = fixture();
    const { container } = render(<CompanyBrief company={company} backHref="/careers/guide" />);
    const context = container.querySelector<HTMLDetailsElement>("details.career-guide-context")!;
    expect(context).not.toBeNull();
    expect(context.open).toBe(false);
    expect(context.textContent).toContain(company.entityName);
    for (const finding of company.findings) expect(context.textContent).toContain(finding.scope);
    expect(context.textContent).toContain("2025-03-31");
  });

  it("keeps long evidence gaps and open questions accessible but collapsed", () => {
    const company = getGuideCompany("brevan-howard-6f761511")!;
    const { container } = render(<CompanyBrief company={company} backHref="/dashboard/careers/guide" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Brevan Howard");
    const gaps = [...container.querySelectorAll<HTMLDetailsElement>("details")].find((item) => item.querySelector("summary")?.textContent?.includes("Evidence gaps"))!;
    expect(gaps.open).toBe(false);
    expect(within(gaps).getByText(company.gaps[0].description)).toBeTruthy();
    const questions = [...container.querySelectorAll<HTMLDetailsElement>("details")].find((item) => item.querySelector("summary")?.textContent?.includes("Questions to verify"))!;
    expect(questions.open).toBe(false);
    expect(within(questions).getByText(company.openQuestions[0])).toBeTruthy();
  });
});
