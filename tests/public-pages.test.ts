// @vitest-environment jsdom

import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "../app/(public)/about/page";
import ContactPage from "../app/(public)/contact/page";
import PrivacyPage from "../app/(public)/privacy/page";
import SecurityPage from "../app/(public)/security/page";
import SponsorsPage from "../app/(public)/sponsors/page";
import TermsPage from "../app/(public)/terms/page";
import { SiteFooter } from "../components/public/site-footer";

describe("public information pages", () => {
  it.each([
    ["about", AboutPage, "EFDS stands for Economics, Finance & Data Science Society"],
    ["privacy", PrivacyPage, "Privacy."],
    ["terms", TermsPage, "Terms of use."],
    ["contact", ContactPage, "Contact."],
    ["security", SecurityPage, "Security & access."],
    ["sponsors", SponsorsPage, "Cornerstone Research"],
  ])("%s renders without authentication", (_route, Page, expectedText) => {
    const { container, unmount } = render(React.createElement(Page));
    const text = container.textContent ?? "";
    expect(container.querySelector("main")).not.toBeNull();
    expect(text).toContain(expectedText);
    expect(text).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|postgres(ql)?:\/\/|sk_live_/i);
    unmount();
  });
});

describe("sponsor acknowledgements", () => {
  it("shows the requested tiers and a direct partnership email", () => {
    const { container } = render(React.createElement(SponsorsPage));
    const entries = Array.from(container.querySelectorAll(".sponsor-entry"));
    expect(entries.map((entry) => entry.textContent)).toEqual([
      expect.stringContaining("OptiverFounding Partner"),
      expect.stringContaining("Cornerstone ResearchFounding Partner"),
      expect.stringContaining("Jane StreetSponsor"),
    ]);
    expect(container.querySelector(".sponsor-contact-link")?.getAttribute("href")).toBe("mailto:siheon.lee25@imperial.ac.uk");
  });
});

describe("public footer", () => {
  it("contains the public information links", () => {
    const { container } = render(React.createElement(SiteFooter));
    const links = Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href"));
    expect(links).toEqual(expect.arrayContaining(["/about", "/sponsors", "/privacy", "/terms", "/contact", "/security"]));
  });
});
