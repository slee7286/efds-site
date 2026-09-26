import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { fixedCareerExamples, rotatingCareerExamples } from "@/lib/careers/daily-examples";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("not-found"); } }));

import PublicGuidePage from "@/app/(public)/careers/guide/page";
import PublicBriefPage from "@/app/(public)/careers/guide/[company]/page";

const examples = [...rotatingCareerExamples.finance, ...rotatingCareerExamples.consulting,
  ...fixedCareerExamples.quantitativeResearch, ...fixedCareerExamples.economicsPolicy];

describe("public company guide", () => {
  it("lists only featured firms and links to their individual briefs without signing in", () => {
    const html = renderToStaticMarkup(<PublicGuidePage />);
    for (const example of examples) {
      expect(html).toContain(`href="/careers/guide/${example.guideId}"`);
      expect(html).toContain(example.name.replaceAll("&", "&amp;"));
    }
    expect(html).not.toContain("/dashboard/careers/guide/");
    expect(html).not.toContain("Accuracy"); // reviewed but not featured
  });

  it("renders each featured brief with its source links to anonymous visitors", async () => {
    for (const example of examples) {
      const page = await PublicBriefPage({ params: Promise.resolve({ company: example.guideId }) });
      const html = renderToStaticMarkup(page);
      expect(html).toContain(example.name.replaceAll("&", "&amp;"));
      expect(html).toContain("Scope:");
      expect(html).toContain("career-guide-citations");
      expect(html).not.toContain("Request student verification");
    }
  });

  it("does not serve a non-featured or unknown company without student access", async () => {
    for (const company of ["accuracy-ac991dd3", "not-a-real-company"]) {
      await expect(PublicBriefPage({ params: Promise.resolve({ company }) })).rejects.toThrow("not-found");
    }
  });
});
