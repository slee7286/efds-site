import { NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { evaluateUserAccess, provisionAuthenticatedProfile } from "@/lib/auth/server";
import { safeInternalPath } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!config.siteUrl) return new NextResponse("NEXT_PUBLIC_SITE_URL is required", { status: 500 });
  if (!code || !isSupabaseConfigured) return NextResponse.redirect(new URL("/login?error=auth_unconfigured", config.siteUrl));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, config.siteUrl));
  const { data: { user } } = await supabase.auth.getUser();
  await provisionAuthenticatedProfile(user);
  const { allowed } = await evaluateUserAccess(user);
  const destination = allowed ? safeInternalPath(url.searchParams.get("next")) ?? "/dashboard" : "/access-denied";
  return NextResponse.redirect(new URL(destination, config.siteUrl));
}
