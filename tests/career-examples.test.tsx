// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CareersPage from "@/app/(public)/careers/page";
import { dailyCareerExample, rotatingCareerExamples } from "@/lib/careers/daily-examples";

describe("daily career examples", () => {
  it("stays the same through one London day and changes at local midnight", () => {
    for (const area of ["finance", "consulting"] as const) {
      const morning = dailyCareerExample(area, new Date("2026-09-24T01:00:00Z"));
      const evening = dailyCareerExample(area, new Date("2026-09-24T22:00:00Z"));
      const nextDay = dailyCareerExample(area, new Date("2026-09-24T23:05:00Z"));
      expect(evening).toEqual(morning);
      expect(nextDay.name).not.toBe(morning.name);
      expect(rotatingCareerExamples[area]).toContainEqual(morning);
    }
  });

  it("does not repeat a firm on consecutive London calendar days", () => {
    for (const area of ["finance", "consulting"] as const) {
      let previous = "";
      for (let day = 1; day <= 28; day++) {
        const firm = dailyCareerExample(area, new Date(`2026-10-${String(day).padStart(2, "0")}T12:00:00Z`));
        expect(firm.name).not.toBe(previous);
        previous = firm.name;
      }
    }
  });
});

describe("public careers examples", () => {
  it("shows requested firms and points students at our guide instead of company sites", () => {
    const { container } = render(<CareersPage />);
    const rows = Array.from(container.querySelectorAll(".career-row"));
    expect(rows.map((row) => row.querySelector("h3")?.textContent)).toEqual([
      "Finance", "Quantitative research", "Economics & policy", "Data & AI", "Consulting", "Software & technology",
    ]);
    expect(rows[1].textContent).toContain("Optiver");
    expect(rows[1].textContent).toContain("Jane Street");
    expect(rows[2].textContent).toContain("Cornerstone Research");
    // The field illustrations are names, not outbound links to company sites.
    const outbound = Array.from(container.querySelectorAll(".career-row-examples a"))
      .map((anchor) => anchor.getAttribute("href"))
      .filter((href) => href?.startsWith("http"));
    expect(outbound).toEqual([]);
    // Every field links into the EFDS careers guide instead, including the two
    // fields that carry no example firms.
    expect(rows.map((row) => row.querySelector(".career-row-examples-guide")?.getAttribute("href")))
      .toEqual(Array.from({ length: rows.length }, () => "/dashboard/careers/guide"));
    expect(container.textContent).toContain("not available to non-EFDS students");
    expect(container.textContent).toContain("EFDS Union society membership");
  });

  it("demos the shape of a guide brief without publishing member research", () => {
    const { container } = render(<CareersPage />);
    const card = container.querySelector(".career-guide-demo-card");
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain("Illustrative example");
    expect(container.querySelectorAll(".career-guide-demo-topics li")).toHaveLength(7);
  });
});
