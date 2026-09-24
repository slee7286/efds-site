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
  it("groups the official sponsor marks by tier and keeps a direct partnership email", () => {
    const { container } = render(React.createElement(SponsorsPage));
    const groups = Array.from(container.querySelectorAll(".sponsor-group"));
    expect(groups.map((group) => ({ tier: group.querySelector("h3")?.textContent, names: Array.from(group.querySelectorAll(".sponsor-entry-caption span")).map((name) => name.textContent) }))).toEqual([
      { tier: "Founding Partner", names: ["Optiver", "Cornerstone Research"] },
      { tier: "Sponsor", names: ["Jane Street"] },
    ]);
    expect(Array.from(container.querySelectorAll(".sponsor-logo-wrap img")).map((logo) => logo.getAttribute("src"))).toEqual([
      "/sponsors/optiver.svg", "/sponsors/cornerstone-research.svg", "/sponsors/jane-street.svg",
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
