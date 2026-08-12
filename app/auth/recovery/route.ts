import { NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { getAccessException, evaluateUserAccess, getAuthUser, provisionAuthenticatedProfile, usesMicrosoftAuthentication } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flow = url.searchParams.get("flow");
  const safeFlow = flow === "setup" || flow === "reset" ? flow : "reset";
  if (!config.siteUrl || !isSupabaseConfigured || !code) return NextResponse.redirect(new URL("/login?error=recovery_unavailable", config.siteUrl || url.origin));

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=recovery_expired", config.siteUrl));

  const user = await getAuthUser();
  const exception = user?.email ? await getAccessException(user.email) : null;
  const profile = await provisionAuthenticatedProfile(user);
  const result = user ? await evaluateUserAccess(user) : { allowed: false };
  if (!user || usesMicrosoftAuthentication(user) || !exception || !profile || !result.allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/access-denied", config.siteUrl));
  }

  return NextResponse.redirect(new URL(`/auth/set-password?flow=${safeFlow}`, config.siteUrl));
}
