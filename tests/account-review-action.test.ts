import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();

vi.mock("../lib/auth/server", () => ({ requireRole: vi.fn(async () => ({ profile: { id: "admin-profile" } })) }));
vi.mock("../lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { reviewAccount } from "../lib/actions/accounts";

describe("account review action", () => {
  beforeEach(() => rpc.mockReset());

  it("accepts a membership decision without an officer or reason field", async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const form = new FormData();
    form.set("profileId", "11111111-1111-4111-8111-111111111111");
    form.set("version", "1");
    form.set("action", "verify");

    await reviewAccount(form);

    expect(rpc).toHaveBeenCalledWith("review_efds_account", {
      p_target_profile_id: "11111111-1111-4111-8111-111111111111",
      p_expected_version: 1,
      p_action: "verify",
      p_reason: null,
      p_officer_id: null,
    });
  });
});
