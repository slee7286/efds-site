import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, requireRole, revalidatePath } = vi.hoisted(() => ({
  rpc: vi.fn(), requireRole: vi.fn(), revalidatePath: vi.fn(),
}));
vi.mock("../lib/config", () => ({ isSupabaseConfigured: true }));
vi.mock("../lib/auth/server", () => ({ requireRole }));
vi.mock("../lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ rpc })),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); },
}));

import { remindTicketAssignees } from "../lib/actions/tickets";

const ticketId = "11111111-1111-4111-8111-111111111111";
function form() {
  const data = new FormData();
  data.set("ticketId", ticketId);
  data.set("expectedVersion", "4");
  return data;
}

describe("ticket reminder action", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("queues a reminder for every linked account through the audited RPC", async () => {
    rpc.mockResolvedValue({ data: 2, error: null });
    await expect(remindTicketAssignees(form())).rejects.toThrow(`/dashboard/tickets/${ticketId}?reminded=2`);
    expect(requireRole).toHaveBeenCalledWith("committee");
    expect(rpc).toHaveBeenCalledWith("request_ticket_reminder", {
      p_ticket_id: ticketId, p_expected_version: 4,
    });
    expect(revalidatePath).toHaveBeenCalledWith(`/dashboard/tickets/${ticketId}`);
  });

  it("explains when no assigned officer has a linked email account", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0008" } });
    await expect(remindTicketAssignees(form())).rejects.toThrow("reminderError=no_recipients");
  });

  it("stops a repeated request within the cooldown", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0007" } });
    await expect(remindTicketAssignees(form())).rejects.toThrow("reminderError=recent");
  });
});
