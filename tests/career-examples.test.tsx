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
  it("shows requested firms, leaves two categories without examples, and explains student access", () => {
    const { container } = render(<CareersPage />);
    const rows = Array.from(container.querySelectorAll(".career-row"));
    expect(rows.map((row) => row.querySelector("h3")?.textContent)).toEqual([
      "Finance", "Quantitative research", "Economics & policy", "Data & AI", "Consulting", "Software & technology",
    ]);
    expect(rows.map((row) => row.querySelectorAll(".career-row-examples a").length)).toEqual([1, 2, 1, 0, 1, 0]);
    expect(rows[1].textContent).toContain("Optiver");
    expect(rows[1].textContent).toContain("Jane Street");
    expect(rows[2].textContent).toContain("Cornerstone Research");
    expect(container.textContent).toContain("not available to non-EFDS students");
    expect(container.textContent).toContain("EFDS Union society membership");
  });
});
