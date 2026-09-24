import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn(), getTicketWorkspace: vi.fn() }));
vi.mock("@/lib/auth/server", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  requireRole: mocks.requireRole,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(async () => ({ auth: { getSession: async () => ({ data: { session: { access_token: "test-session" } } }) } })),
}));
vi.mock("@/lib/db/tickets", () => ({ getTicketWorkspace: mocks.getTicketWorkspace }));

import { AuthorizationError } from "@/lib/auth/server";
import { POST } from "@/app/api/tickets/suggest/route";

const evidence = {
  id: "S1",
  retrieval_unit_id: "11111111-1111-4111-8111-111111111111",
  source_record_id: "22222222-2222-4222-8222-222222222222",
  source_type: "slack_message",
  title: "#events",
  review_status: "source_generated",
  authority: "committee_slack",
  metadata: { visibility: "committee" },
};

function request(focus: string) {
  return new Request("https://www.imperial-efds.com/api/tickets/suggest", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ focus }),
  });
}

describe("ticket suggestion API permission boundary", () => {
  beforeEach(() => {
    vi.stubEnv("EFDS_AGENT_URL", "https://agent.example.org");
    mocks.requireRole.mockReset().mockResolvedValue({});
    mocks.getTicketWorkspace.mockReset().mockResolvedValue({ tickets: [] });
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it("requests only committee-scoped Slack and requires a safe cited source", async () => {
    const upstream = vi.fn(async (_url: string, options: RequestInit) => {
      expect(JSON.parse(String(options.body))).toMatchObject({ scope: "committee", source_mode: "committee_tickets" });
      return Response.json({ answer: "Confirm the venue. [S1]", citations: [evidence], insufficient_evidence: false });
    });
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request("committee"));
    expect(mocks.requireRole).toHaveBeenCalledWith("committee");
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.reviewable).toBe(true);
    expect(result.citedSources[0].route).toBe("/dashboard/slack/messages/22222222-2222-4222-8222-222222222222");
    expect(upstream).toHaveBeenCalledOnce();
  });

  it("does not call the agent for a committee user requesting private meetings", async () => {
    mocks.requireRole.mockRejectedValueOnce(new AuthorizationError("admin required"));
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request("meetings"));
    expect(response.status).toBe(403);
    expect(mocks.requireRole).toHaveBeenCalledWith("admin");
    expect(upstream).not.toHaveBeenCalled();
  });

  it("refuses an internal citation even if an upstream agent returns one", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      answer: "Confirm the venue. [S1]", citations: [{ ...evidence, metadata: { visibility: "internal" } }],
      insufficient_evidence: false,
    })));
    const response = await POST(request("committee"));
    expect(response.status).toBe(502);
    expect((await response.json()).error).toMatch(/outside committee access/);
  });

  it("keeps Outlook suggestions admin-only and linked to the approved Outlook host", async () => {
    const upstream = vi.fn(async (_url: string, options: RequestInit) => {
      expect(JSON.parse(String(options.body))).toMatchObject({ scope: "admin", source_mode: "admin_outlook_tickets" });
      return Response.json({ answer: "Confirm the event timing. [S1]", citations: [{
        ...evidence, source_type: "outlook_message", review_status: "source_generated",
        authority: "outlook_mail", metadata: { visibility: "internal" },
        url: "https://outlook.office.com/mail/id/example",
      }] });
    });
    vi.stubGlobal("fetch", upstream);
    const response = await POST(request("outlook"));
    expect(mocks.requireRole).toHaveBeenCalledWith("admin");
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.reviewable).toBe(true);
    expect(result.citedSources[0].url).toBe("https://outlook.office.com/mail/id/example");
    expect(result.citedSources[0].route).toBeNull();
  });

  it("refuses Outlook citations linked to untrusted hosts or embedded credentials", async () => {
    for (const url of ["https://outlook.evil.example/mail/steal", "https://attacker@outlook.office.com/mail/id/example"]) {
      vi.stubGlobal("fetch", vi.fn(async () => Response.json({
        answer: "Confirm the event timing. [S1]", citations: [{ ...evidence,
          source_type: "outlook_message", authority: "outlook_mail", metadata: { visibility: "internal" },
          url,
        }],
      })));
      expect((await POST(request("outlook"))).status).toBe(502);
    }
  });
});
