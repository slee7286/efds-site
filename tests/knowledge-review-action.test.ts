import { beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

const rpc = vi.fn();

vi.mock("../lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("../lib/auth/server", () => ({ requireRole: vi.fn(async () => ({ profile: { id: "admin-profile" } })) }));
vi.mock("../lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { reviewKnowledgeAction } from "../lib/actions/knowledge-review";

describe("transactional knowledge review action", () => {
  beforeEach(() => rpc.mockReset());

  it("sends approve to the database transaction RPC with the loaded version", async () => {
    rpc.mockResolvedValue({ data: { event_id: "event-1", review_version: 2 }, error: null });
    const form = new FormData();
    form.set("action", "approve");
    form.set("knowledgeType", "requirement");
    form.set("recordId", "11111111-1111-4111-8111-111111111111");
    form.set("expectedVersion", "1");
    await reviewKnowledgeAction(form);
    expect(rpc).toHaveBeenCalledWith("review_knowledge_transaction", expect.objectContaining({
      p_knowledge_type: "requirement",
      p_action: "approve",
      p_expected_version: 1,
      p_patch: {},
    }));
    expect(redirect).toHaveBeenCalledWith(expect.stringMatching(/^\/admin\/knowledge\/review\/requirement\/11111111-1111-4111-8111-111111111111\?saved=approve&confirmation=/));
  });

  it("maps an edit form to interpretation fields and never sends source fields", async () => {
    rpc.mockResolvedValue({ data: { event_id: "event-2", review_version: 2 }, error: null });
    const form = new FormData();
    form.set("action", "edit_approve");
    form.set("knowledgeType", "timing_rule");
    form.set("recordId", "11111111-1111-4111-8111-111111111111");
    form.set("expectedVersion", "1");
    form.set("description", "Ten working days before the event");
    form.set("deadline_type", "relative_notice");
    form.set("working_days", "true");
    form.set("source_content_hash", "must-not-be-forwarded");
    await reviewKnowledgeAction(form);
    const args = rpc.mock.calls[0][1] as { p_patch: Record<string, unknown> };
    expect(args.p_patch).toMatchObject({ description: "Ten working days before the event", deadline_type: "relative_notice", working_days: true });
    expect(args.p_patch).not.toHaveProperty("source_content_hash");
  });
});
