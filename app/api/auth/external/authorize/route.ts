import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccessException, evaluateUserAccess, provisionAuthenticatedProfile, getAuthUser } from "@/lib/auth/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { safeInternalPath } from "@/lib/auth/redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const requestSchema = z.object({ next: z.string().optional() });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success || !isSupabaseConfigured) return NextResponse.json({ message: "Authentication is not configured." }, { status: 503 });

  const supabase = await createServerSupabaseClient();
  const user = await getAuthUser();
  const exception = user?.email ? await getAccessException(user.email) : null;
  const profile = await provisionAuthenticatedProfile(user);
  const result = await evaluateUserAccess(user);

  if (!user || !exception || !profile || !result.allowed) {
    await supabase.auth.signOut();
    return NextResponse.json({ message: "This account is not currently authorised for EFDS external access." }, { status: 403 });
  }

  const requestedPath = safeInternalPath(parsed.data.next ?? null) ?? "/dashboard";
  return NextResponse.json({ redirect: requestedPath, site: config.siteUrl });
}
