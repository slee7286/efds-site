import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, requireRole, createClient, config } = vi.hoisted(() => ({
  rpc: vi.fn(), requireRole: vi.fn(), createClient: vi.fn(),
  config: { isSupabaseConfigured: true },
}));
vi.mock("@/lib/config", () => config);
vi.mock("@/lib/auth/server", () => ({ requireRole }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: createClient }));

import * as accounts from "@/lib/db/accounts";

beforeEach(() => {
  vi.resetAllMocks();
  config.isSupabaseConfigured = true;
  createClient.mockResolvedValue({ rpc });
});

describe("registrations without profiles", () => {
  it("returns an empty list for unconfigured local preview without auth or database access", async () => {
    config.isSupabaseConfigured = false;
    requireRole.mockRejectedValue(new Error("The admin role is required"));

    await expect(accounts.getUnprovisionedAccounts()).resolves.toEqual([]);
    expect(requireRole).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects non-admin access before creating a client or calling the RPC", async () => {
    const denied = new Error("The admin role is required");
    requireRole.mockRejectedValue(denied);
    await expect(accounts.getUnprovisionedAccounts()).rejects.toBe(denied);
    expect(createClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("propagates RPC failures clearly instead of hiding registrations behind an empty list", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "admin_unprovisioned_accounts does not exist" } });
    await expect(accounts.getUnprovisionedAccounts()).rejects.toThrow(
      "Could not load registrations without profiles: admin_unprovisioned_accounts does not exist",
    );
  });

  it("returns an empty list when the RPC finds no registrations", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await accounts.getUnprovisionedAccounts()).toEqual([]);
  });
  it("loads the admin RPC and maps registration fields without adding profile or role identifiers", async () => {
    rpc.mockResolvedValue({ data: [{
      auth_user_id: "00000000-0000-4000-8000-000000000001", email: "member@ic.ac.uk",
      full_name: null, created_at: "2026-10-01T10:00:00Z", email_confirmed_at: null, reason: "email_unconfirmed",
    }, {
      auth_user_id: "00000000-0000-4000-8000-000000000002", email: "student@ic.ac.uk",
      full_name: "Student", created_at: "2026-10-02T10:00:00Z", email_confirmed_at: "2026-10-02T10:05:00Z", reason: "profile_missing",
    }], error: null });
    expect(await accounts.getUnprovisionedAccounts()).toEqual([{
      authUserId: "00000000-0000-4000-8000-000000000001", email: "member@ic.ac.uk",
      fullName: null, createdAt: "2026-10-01T10:00:00Z", emailConfirmedAt: null, reason: "email_unconfirmed",
    }, {
      authUserId: "00000000-0000-4000-8000-000000000002", email: "student@ic.ac.uk",
      fullName: "Student", createdAt: "2026-10-02T10:00:00Z", emailConfirmedAt: "2026-10-02T10:05:00Z", reason: "profile_missing",
    }]);
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(rpc).toHaveBeenCalledWith("admin_unprovisioned_accounts");
  });
});
