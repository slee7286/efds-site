// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

import { AppSidebar } from "../components/dashboard/sidebar";

describe("workspace navigation", () => {
  it.each(["committee", "admin"] as const)("puts the shared overview first for %s", (role) => {
    const { container } = render(<AppSidebar role={role} />);
    const operations = screen.getByRole("navigation", { name: "Society operations navigation" });
    const workspace = screen.getByRole("navigation", { name: "Private navigation" });
    expect(within(operations).getAllByRole("link").slice(0, 2).map((link) => link.textContent)).toEqual(["Overview", "Tickets"]);
    expect(within(operations).getByRole("link", { name: "Overview" }).getAttribute("href")).toBe("/dashboard");
    expect(within(workspace).queryByRole("link", { name: "Dashboard" })).toBeNull();
    const labels = [...container.querySelectorAll(".sidebar-label")].map((label) => label.textContent);
    expect(labels).toEqual(["Society operations", "Your workspace"]);
  });

  it("keeps the dashboard in the member workspace", () => {
    render(<AppSidebar role="member" />);
    expect(screen.queryByRole("navigation", { name: "Society operations navigation" })).toBeNull();
    expect(within(screen.getByRole("navigation", { name: "Private navigation" })).getByRole("link", { name: "Dashboard" }).getAttribute("href")).toBe("/dashboard");
  });
});
