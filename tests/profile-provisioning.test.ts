import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../lib/config", () => ({
  config: { allowedEmailDomains: ["ic.ac.uk", "imperial.ac.uk"] },
  isSupabaseConfigured: true,
}));
vi.mock("../lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

import { provisionAuthenticatedProfile } from "../lib/auth/server";

const user = { id: "00000000-0000-4000-8000-000000000001", email: "member@imperial.ac.uk", email_confirmed_at: "2026-09-23T00:00:00Z", user_metadata: {} };
const memberRow = {
  id: "00000000-0000-4000-8000-000000000002", auth_user_id: user.id, email: user.email,
  full_name: null, avatar_path: null, access_role: "member", member_type: "imperial",
  efds_verification_status: "pending", efds_verification_claim: null, access_version: 1,
  officer_id: null, active: true, last_login_at: null,
};

function provisioningClient(concurrentRow?: typeof memberRow) {
  let stored: typeof memberRow | null = null;
  let reads = 0;
  const maybeSingle = vi.fn(async () => {
    const data = stored;
    // Simulate a trigger/another callback committing after the initial lookup.
    if (reads++ === 0 && concurrentRow) stored = { ...concurrentRow };
    return { data, error: null };
  });
  const insert = vi.fn((values: Partial<typeof memberRow>) => {
    const error = stored ? { code: "23505", message: "duplicate auth_user_id" } : null;
    if (!stored) stored = { ...memberRow, ...values };
    return { select: () => ({ single: async () => ({ data: error ? null : stored, error }) }) };
  });
  const upsert = vi.fn(async (values: Partial<typeof memberRow>, options: { onConflict?: string; ignoreDuplicates?: boolean }) => {
    if (!stored || !options.ignoreDuplicates) stored = { ...memberRow, ...stored, ...values };
    return { data: null, error: null };
  });
  return {
    client: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }), insert, upsert }) },
    insert, upsert, maybeSingle, stored: () => stored,
  };
}

describe("profile provisioning boundary", () => {
  it("creates a basic member on first signup through a conflict-safe write and re-reads the stored profile", async () => {
    const { client, upsert, maybeSingle } = provisioningClient();
    const profile = await provisionAuthenticatedProfile(user as never, client as never);
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ auth_user_id: user.id, access_role: "member", member_type: "imperial" }),
      { onConflict: "auth_user_id", ignoreDuplicates: true },
    );
    expect(maybeSingle).toHaveBeenCalledTimes(2);
    expect(profile?.verificationStatus).toBe("pending");
    expect(profile?.accessRole).toBe("member");
  });

  it.each(["admin", "committee"])("returns a concurrently provisioned %s profile without overwriting its role", async (role) => {
    const privileged = { ...memberRow, access_role: role, efds_verification_status: "approved", access_version: 4 };
    const { client, stored, insert } = provisioningClient(privileged);
    const profile = await provisionAuthenticatedProfile(user as never, client as never);
    expect(profile?.accessRole).toBe(role);
    expect(profile?.verificationStatus).toBe("approved");
    expect(profile?.accessVersion).toBe(4);
    expect(stored()).toEqual(privileged);
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not reactivate or return a concurrently provisioned inactive account", async () => {
    const inactive = { ...memberRow, active: false, access_role: "admin" };
    const { client, stored, upsert } = provisioningClient(inactive);
    expect(await provisionAuthenticatedProfile(user as never, client as never)).toBeNull();
    expect(upsert).toHaveBeenCalledWith(expect.anything(), { onConflict: "auth_user_id", ignoreDuplicates: true });
    expect(stored()).toEqual(inactive);
  });

  it("never promotes an existing external account from an access exception during sign-in", async () => {
    const externalUser = { ...user, email: "member@example.org" };
    const existing = { ...memberRow, email: externalUser.email, member_type: "external" };
    const update = vi.fn().mockReturnValue({ eq: () => ({ select: () => ({ single: async () => ({ data: existing, error: null }) }) }) });
    const client = {
      rpc: async () => ({ data: "admin", error: null }),
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing, error: null }) }) }), update }),
    };
    const profile = await provisionAuthenticatedProfile(externalUser as never, client as never);
    expect(update).toHaveBeenCalledOnce();
    expect(update.mock.calls[0][0]).not.toHaveProperty("access_role");
    expect(profile?.accessRole).toBe("member");
  });
});
