// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

const { getAccountReviewData, getUnprovisionedAccounts, reviewForm } = vi.hoisted(() => ({
  getAccountReviewData: vi.fn(), getUnprovisionedAccounts: vi.fn(), reviewForm: vi.fn(),
}));
vi.mock("@/lib/db/accounts", () => ({
  getAccountReviewData, getUnprovisionedAccounts, getAccountNoticeHealth: async () => null,
}));
vi.mock("@/lib/auth/server", () => ({ getCurrentProfile: async () => ({ id: "admin" }) }));
vi.mock("@/components/admin/account-review-form", () => ({ AccountReviewForm: reviewForm }));

import AdminAccountsPage from "@/app/admin/accounts/page";

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  getAccountReviewData.mockResolvedValue({ accounts: [], officers: [], events: [], pendingCount: 2, standardCount: 0, accountCount: 0 });
  getUnprovisionedAccounts.mockResolvedValue([]);
});

describe("account review page filters", () => {
  it.each(["pending", "standard", "all"])("keeps registrations without profiles visible under the %s filter with no role controls", async (status) => {
    getUnprovisionedAccounts.mockResolvedValue([{
      authUserId: "auth-registration", email: "pending@imperial.ac.uk", fullName: "Pending member",
      createdAt: "2026-10-01T10:00:00Z", emailConfirmedAt: null, reason: "email_unconfirmed",
    }]);
    const { container } = render(await AdminAccountsPage({ searchParams: Promise.resolve({ status }) }));
    expect(getUnprovisionedAccounts).toHaveBeenCalledOnce();
    expect(getAccountReviewData).toHaveBeenCalledWith(status, 1);
    const registrations = screen.getByRole("region", { name: "Registrations without profiles" });
    expect(within(registrations).getByText("pending@imperial.ac.uk")).toBeTruthy();
    expect(within(registrations).getByText("Email confirmation pending")).toBeTruthy();
    expect(within(registrations).getByText(/request a new sign-in or signup email themselves/)).toBeTruthy();
    expect(within(registrations).getByText(/must not force confirmation or grant roles/)).toBeTruthy();
    expect(registrations.querySelector("form, input, select, button")).toBeNull();
    expect(container.querySelector('[name="profile_id"]')).toBeNull();
    expect(reviewForm).not.toHaveBeenCalled();
  });

  it.each([
    ["email_not_eligible", "Email not eligible"],
    ["profile_conflict", "Profile conflict"],
    ["profile_missing", "Profile missing"],
    ["account_disabled", "Account disabled"],
  ])("explains the %s registration reason without offering access changes", async (reason, label) => {
    getUnprovisionedAccounts.mockResolvedValue([{
      authUserId: "auth-registration", email: "confirmed@ic.ac.uk", fullName: null,
      createdAt: "2026-10-01T10:00:00Z", emailConfirmedAt: "2026-10-01T10:05:00Z", reason,
    }]);
    render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));
    const registrations = screen.getByRole("region", { name: "Registrations without profiles" });
    expect(within(registrations).getByText(label)).toBeTruthy();
    expect(within(registrations).getByText("Email confirmed")).toBeTruthy();
    expect(registrations.querySelector("form, input, select, button")).toBeNull();
    expect(reviewForm).not.toHaveBeenCalled();
  });

  it("shows a sensible empty state for registrations without profiles", async () => {
    render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));
    const registrations = screen.getByRole("region", { name: "Registrations without profiles" });
    expect(within(registrations).getByText("No registrations are waiting for a profile.")).toBeTruthy();
  });

  it("explains that confirmed provisioned accounts appear without requiring another sign-in", async () => {
    render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));
    expect(within(screen.getByRole("region", { name: "Accounts" })).getByText(
      "Accounts appear once email ownership is confirmed and an application profile is provisioned.",
    )).toBeTruthy();
  });

  it("keeps the active-account list paginated independently of registrations", async () => {
    getAccountReviewData.mockResolvedValue({ accounts: [], officers: [], events: [], pendingCount: 2, standardCount: 0, accountCount: 60 });
    render(await AdminAccountsPage({ searchParams: Promise.resolve({ status: "all", page: "2" }) }));
    expect(getAccountReviewData).toHaveBeenCalledWith("all", 2);
    const pagination = screen.getByRole("navigation", { name: "Account pages" });
    expect(within(pagination).getByText("Page 2 of 3")).toBeTruthy();
    expect(within(pagination).getByRole("link", { name: "Previous" }).getAttribute("href")).toBe("/admin/accounts?status=all&page=1");
    expect(within(pagination).getByRole("link", { name: "Next" }).getAttribute("href")).toBe("/admin/accounts?status=all&page=3");
    expect(getUnprovisionedAccounts).toHaveBeenCalledWith();
  });

  it("defaults to all active accounts so members without claims remain visible", async () => {
    render(await AdminAccountsPage({ searchParams: Promise.resolve({}) }));
    expect(getAccountReviewData).toHaveBeenCalledWith("all", 1);
    expect(screen.getByRole("link", { name: "All active accounts" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: /Needs review/ }).getAttribute("href")).toBe("/admin/accounts?status=pending");
  });
});
