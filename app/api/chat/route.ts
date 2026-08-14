import { NextResponse } from "next/server";
import { z } from "zod";
import { assertScope } from "@/lib/agents/types";
import { evaluateUserAccess } from "@/lib/auth/server";
import { canUseScope } from "@/lib/auth/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({ message: z.string().trim().min(1).max(1000), scope: z.enum(["public", "member", "committee", "admin"]), source_mode: z.literal("preterm_knowledge").default("preterm_knowledge"), conversation: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) })).max(4).default([]) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const scope = assertScope(parsed.data.scope);
  let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
  let accessToken: string | null = null;
  if (scope !== "public") {
    supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    const { allowed, profile } = await evaluateUserAccess(user);
    if (!allowed || !profile) return NextResponse.json({ error: "Authorised profile required" }, { status: 401 });
    if (!canUseScope(profile.accessRole, scope)) return NextResponse.json({ error: "Insufficient access scope" }, { status: 403 });
    const { data: sessionData } = await supabase.auth.getSession();
    accessToken = sessionData.session?.access_token ?? null;
  }
  const agentUrl = process.env.EFDS_AGENT_URL?.replace(/\/$/, "");
  if (!agentUrl) return NextResponse.json({ error: "Agent service is not configured" }, { status: 503 });
  if (scope !== "public" && !accessToken) return NextResponse.json({ error: "Authenticated session required" }, { status: 401 });
  const serviceSecret = process.env.EFDS_AGENT_SHARED_SECRET;
  const callAgent = async (token: string | null) => fetch(`${agentUrl}/v1/query/stream`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "text/event-stream", ...(serviceSecret ? { "X-EFDS-Agent-Secret": serviceSecret } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ query: parsed.data.message, scope, source_mode: parsed.data.source_mode, conversation: parsed.data.conversation }), cache: "no-store" });
  let upstream: Response;
  try {
    upstream = await callAgent(accessToken);
    // Supabase SSR normally refreshes during getUser(). If an already-issued
    // access token still expires between that call and the agent request,
    // refresh once and retry; never loop or retry authorization failures.
    if (upstream.status === 401 && supabase) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      const refreshedToken = refreshed.session?.access_token ?? null;
      if (refreshedToken) upstream = await callAgent(refreshedToken);
    }
  } catch {
    return NextResponse.json({ error: "Agent service is unavailable" }, { status: 502 });
  }
  if (!upstream.ok) {
    if (upstream.status === 401) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    if (upstream.status === 403) return NextResponse.json({ error: "You do not have access to that scope." }, { status: 403 });
    return NextResponse.json({ error: "Agent service is temporarily unavailable" }, { status: 502 });
  }
  return new Response(upstream.body, { status: 200, headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" } });
}
