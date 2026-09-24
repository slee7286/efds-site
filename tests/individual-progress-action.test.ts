import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, requireRole, revalidatePath } = vi.hoisted(() => ({ rpc: vi.fn(), requireRole: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/auth/server", () => ({ requireRole }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn(async () => ({ rpc })) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); } }));

import { updateIndividualTicketProgress } from "@/lib/actions/tickets";

const ticketId = "11111111-1111-4111-8111-111111111111";
const officerId = "22222222-2222-4222-8222-222222222222";
function form(action: "mode" | "status") {
  const data = new FormData();
  data.set("ticketId", ticketId); data.set("expectedVersion", "4"); data.set("progressAction", action);
  if (action === "mode") data.set("enabled", "true");
  else { data.set("officerId", officerId); data.set("individualStatus", "completed"); }
  return data;
}

describe("individual ticket progress action", () => {
  beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: { review_version: 5 }, error: null }); });

  it("enables per-person progress through the committee-only audited RPC", async () => {
    await expect(updateIndividualTicketProgress(form("mode"))).rejects.toThrow(`progressSaved=mode`);
    expect(requireRole).toHaveBeenCalledWith("committee");
    expect(rpc).toHaveBeenCalledWith("set_committee_ticket_individual_progress", {
      p_ticket_id: ticketId, p_expected_version: 4, p_enabled: true, p_officer_id: null, p_status: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("updates only the selected officer", async () => {
    await expect(updateIndividualTicketProgress(form("status"))).rejects.toThrow(`progressSaved=status`);
    expect(rpc).toHaveBeenCalledWith("set_committee_ticket_individual_progress", {
      p_ticket_id: ticketId, p_expected_version: 4, p_enabled: null, p_officer_id: officerId, p_status: "completed",
    });
  });

  it("rejects a stale ticket version with a clear return state", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0006" } });
    await expect(updateIndividualTicketProgress(form("status"))).rejects.toThrow("progressError=conflict");
  });
});
