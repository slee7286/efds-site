import { describe, expect, it } from "vitest";
import { actionToastMessage } from "@/components/feedback/action-toast";

describe("save confirmation messages", () => {
  it("announces confirmed saves and never calls a failed update a success", () => {
    expect(actionToastMessage("/dashboard/tickets/abc", new URLSearchParams("saved=assign"))?.text).toBe("Ticket assignments saved.");
    expect(actionToastMessage("/admin/accounts", new URLSearchParams("notice=queued"))?.text).toBe("Account decision saved.");
    expect(actionToastMessage("/admin/knowledge/review/process/abc", new URLSearchParams("saved=edit_approve"))?.text).toBe("Knowledge change saved.");
    expect(actionToastMessage("/dashboard/tickets/abc", new URLSearchParams("error=conflict"))?.warning).toBe(true);
    expect(actionToastMessage("/dashboard/tickets/abc", new URLSearchParams()) ).toBeNull();
  });
});
