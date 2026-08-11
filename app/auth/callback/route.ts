import { NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { evaluateUserAccess, upsertImperialProfile } from "@/lib/auth/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code || !isSupabaseConfigured) return NextResponse.redirect(new URL("/login?error=auth_unconfigured", config.siteUrl));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, config.siteUrl));
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) await upsertImperialProfile(user);
  const { allowed } = await evaluateUserAccess(user);
  return NextResponse.redirect(new URL(allowed ? "/dashboard" : "/access-denied", config.siteUrl));
}
