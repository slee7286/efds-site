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

describe("profile provisioning boundary", () => {
  it("creates a basic member even for a verified Imperial email", async () => {
    const insert = vi.fn().mockReturnValue({ select: () => ({ single: async () => ({ data: memberRow, error: null }) }) });
    const client = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), insert }) };
    const profile = await provisionAuthenticatedProfile(user as never, client as never);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ access_role: "member", member_type: "imperial" }));
    expect(profile?.verificationStatus).toBe("pending");
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
