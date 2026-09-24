import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

const db = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn() }));
vi.mock("../lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("../lib/auth/server", () => ({ requireRole: vi.fn(async () => ({ profile: { id: "admin" } })) }));
vi.mock("../lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({
  rpc: db.rpc,
  from: () => ({ select: () => ({ eq: () => ({ single: db.single }) }) }),
})) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { operationalRecordAction } from "@/lib/actions/operations";

describe("agent ticket proposal review", () => {
  beforeEach(() => { db.rpc.mockReset(); db.single.mockReset(); });

  it("saves a cited suggestion as a private proposal through the audited RPC", async () => {
    db.rpc.mockResolvedValue({ data: { record: { id: "22222222-2222-4222-8222-222222222222" } }, error: null });
    const form = new FormData();
    form.set("action", "create"); form.set("recordType", "action_item");
    form.set("title", "Confirm a venue"); form.set("description", "Meeting notes suggest a booking. [S1]");
    form.set("patch", JSON.stringify({ retrieval_unit_id: "11111111-1111-4111-8111-111111111111", metadata: { origin: "agent_ticket_suggestion" } }));
    await operationalRecordAction(form);
    expect(db.rpc).toHaveBeenCalledWith("mutate_operational_record", expect.objectContaining({
      p_action: "create", p_patch: expect.objectContaining({ record_type: "action_item", title: "Confirm a venue", retrieval_unit_id: "11111111-1111-4111-8111-111111111111" }),
    }));
    expect(redirect).toHaveBeenCalledWith(expect.stringMatching(/^\/admin\/operations\/22222222-2222-4222-8222-222222222222\?saved=create&confirmation=/));
  });

  it("blocks broad publication of an AI suggestion before invoking the mutation RPC", async () => {
    db.single.mockResolvedValue({ data: { metadata: { origin: "agent_ticket_suggestion" } }, error: null });
    const form = new FormData();
    form.set("action", "publish"); form.set("recordId", "22222222-2222-4222-8222-222222222222");
    form.set("expectedVersion", "2"); form.set("visibility", "public");
    await expect(operationalRecordAction(form)).rejects.toThrow("only be published to the committee workspace");
    expect(db.rpc).not.toHaveBeenCalled();
  });
});
