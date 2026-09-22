// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({ order: vi.fn() }));
vi.mock("@/lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/auth/server", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({
    from: () => ({ select: () => ({ order: database.order }) }),
  }),
}));

import ResourcesPage from "../app/(public)/resources/page";

describe("public Resources dependency states", () => {
  beforeEach(() => { database.order.mockReset(); });

  it("keeps official links and a retry available when the collection fails", async () => {
    const error = { code: "", message: "TypeError: fetch failed", details: "Private diagnostic detail", hint: "" };
    database.order.mockResolvedValue({ data: null, error });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const { container } = render(await ResourcesPage());
      expect(screen.getByRole("status").textContent).toContain("temporarily unavailable");
      expect(screen.getByRole("link", { name: /Visit Imperial Library/ })).toBeTruthy();
      expect(screen.getByRole("link", { name: /Visit Careers Service/ })).toBeTruthy();
      expect(screen.getByRole("link", { name: /Visit EFDS at the Union/ })).toBeTruthy();
      expect(screen.getByRole("link", { name: /Try again/ }).getAttribute("href")).toBe("/resources");
      expect(container.textContent).not.toContain("No society resources have been published");
      expect(container.textContent).not.toMatch(/fetch failed|Private diagnostic detail/);
      expect(log).toHaveBeenCalledWith("Published EFDS resources could not be loaded", error);
    } finally { log.mockRestore(); }
  });

  it("distinguishes an empty published collection from a failed request", async () => {
    database.order.mockResolvedValue({ data: [], error: null });
    const { container } = render(await ResourcesPage());
    expect(container.textContent).toContain("No society resources have been published here yet");
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders available published resources normally", async () => {
    database.order.mockResolvedValue({ data: [{ id: "public-1", name: "Example resource", url: "https://example.com/resource", source_article_title: "Reviewed source" }], error: null });
    render(await ResourcesPage());
    expect(screen.getByRole("heading", { name: "Example resource" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Open resource/ }).getAttribute("href")).toBe("https://example.com/resource");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
