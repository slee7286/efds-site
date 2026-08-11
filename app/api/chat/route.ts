import { NextResponse } from "next/server";
import { z } from "zod";
import { mockAgent } from "@/lib/agents/mock";
import { assertScope } from "@/lib/agents/types";
import { evaluateUserAccess, getAuthUser } from "@/lib/auth/server";
import { canUseScope } from "@/lib/auth/roles";

const requestSchema = z.object({ message: z.string().trim().min(1).max(1000), scope: z.enum(["public", "member", "committee", "admin"]) });

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const scope = assertScope(parsed.data.scope);
  if (scope !== "public") {
    const user = await getAuthUser();
    const { allowed, profile } = await evaluateUserAccess(user);
    if (!allowed || !profile) return NextResponse.json({ error: "Authorised profile required" }, { status: 401 });
    if (!canUseScope(profile.accessRole, scope)) return NextResponse.json({ error: "Insufficient access scope" }, { status: 403 });
  }
  let message = "";
  for await (const chunk of mockAgent.stream({ message: parsed.data.message, scope })) message += chunk;
  return NextResponse.json({ message: message.trim(), scope });
}
