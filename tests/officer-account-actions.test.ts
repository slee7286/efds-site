import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, from, query, requireRole, revalidatePath } = vi.hoisted(() => {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() };
  return { rpc: vi.fn(), from: vi.fn(), query, requireRole: vi.fn(), revalidatePath: vi.fn() };
});

vi.mock("../lib/auth/server", () => ({ requireRole }));
vi.mock("../lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc, from })) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); } }));

import { linkOfficerAccount, unlinkOfficerAccount } from "../lib/actions/officers";

const officerId = "11111111-1111-4111-8111-111111111111";
const profileId = "22222222-2222-4222-8222-222222222222";

function linkForm(email: string) {
  const form = new FormData();
  form.set("officerId", officerId);
  form.set("email", email);
  return form;
}

function unlinkForm() {
  const form = new FormData();
  form.set("officerId", officerId);
  form.set("profileId", profileId);
  form.set("version", "4");
  return form;
}

describe("officer account links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireRole.mockResolvedValue({ profile: { accessRole: "admin" } });
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    from.mockReturnValue(query);
  });

  it("requires admin access and an existing elevated account before linking", async () => {
    query.maybeSingle.mockResolvedValue({ data: { id: profileId, access_role: "member", access_version: 4, officer_id: null }, error: null });
    await expect(linkOfficerAccount(linkForm("Officer@Example.com"))).rejects.toThrow("committee_required");
    expect(requireRole).toHaveBeenCalledWith("admin");
    expect(query.eq).toHaveBeenCalledWith("email", "officer@example.com");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("links a committee account through the reviewed, versioned RPC", async () => {
    query.maybeSingle.mockResolvedValue({ data: { id: profileId, access_role: "committee", access_version: 4, officer_id: null }, error: null });
    rpc.mockImplementation(async (name: string) => name === "review_efds_account"
      ? { data: [{ access_version: 5 }], error: null }
      : { data: "pending", error: null });
    await expect(linkOfficerAccount(linkForm("Officer@Example.com"))).rejects.toThrow("notice=linked&mail=queued");
    expect(rpc).toHaveBeenCalledWith("review_efds_account", {
      p_target_profile_id: profileId, p_expected_version: 4, p_action: "link_officer", p_reason: null, p_officer_id: officerId,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/committee");
  });

  it("refuses to unlink a different or stale officer assignment", async () => {
    query.maybeSingle.mockResolvedValue({ data: { officer_id: null, access_version: 4 }, error: null });
    await expect(unlinkOfficerAccount(unlinkForm())).rejects.toThrow("error=stale");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("removes a link through the same audited RPC", async () => {
    query.maybeSingle.mockResolvedValue({ data: { officer_id: officerId, access_version: 4 }, error: null });
    rpc.mockImplementation(async (name: string) => name === "review_efds_account"
      ? { data: [{ access_version: 5 }], error: null }
      : { data: "accepted", error: null });
    await expect(unlinkOfficerAccount(unlinkForm())).rejects.toThrow("notice=unlinked&mail=accepted");
    expect(rpc).toHaveBeenCalledWith("review_efds_account", {
      p_target_profile_id: profileId, p_expected_version: 4, p_action: "link_officer", p_reason: null, p_officer_id: null,
    });
  });
});
