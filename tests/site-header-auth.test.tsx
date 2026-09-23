// @vitest-environment jsdom

import React from "react";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  getClaims: vi.fn(),
  listener: null as null | ((event: string, session: { user: { id: string } } | null) => void),
  unsubscribe: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getClaims: auth.getClaims,
      onAuthStateChange: (listener: typeof auth.listener) => {
        auth.listener = listener;
        return { data: { subscription: { unsubscribe: auth.unsubscribe } } };
      },
    },
  }),
}));

import { SiteHeader } from "../components/public/site-header";

describe("public account navigation", () => {
  beforeEach(() => {
    auth.getClaims.mockReset();
    auth.unsubscribe.mockReset();
    auth.listener = null;
  });

  it("restores Workspace from an existing session after returning to the site", async () => {
    auth.getClaims.mockResolvedValue({ data: { claims: { sub: "member-id" } }, error: null });
    const firstVisit = render(<SiteHeader />);
    expect(screen.getByRole("link", { name: "Login" }).getAttribute("href")).toBe("/login");
    expect((await screen.findByRole("link", { name: "Workspace" })).getAttribute("href")).toBe("/dashboard");

    firstVisit.unmount();
    render(<SiteHeader />);
    expect((await screen.findByRole("link", { name: "Workspace" })).getAttribute("href")).toBe("/dashboard");
  });

  it("returns to Login when the session is signed out", async () => {
    auth.getClaims.mockResolvedValue({ data: { claims: { sub: "member-id" } }, error: null });
    render(<SiteHeader />);
    await screen.findByRole("link", { name: "Workspace" });
    act(() => auth.listener?.("SIGNED_OUT", null));
    expect(screen.getByRole("link", { name: "Login" }).getAttribute("href")).toBe("/login");
  });
});
