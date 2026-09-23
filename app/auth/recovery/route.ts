import { NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { getAccessException, evaluateUserAccess, provisionAuthenticatedProfile, usesMicrosoftAuthentication } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EMAIL_FLOW_COOKIE } from "@/lib/auth/email-flow";

function redirectAfterRecovery(path: string, origin: string) {
  const response = NextResponse.redirect(new URL(path, origin));
  response.cookies.delete(EMAIL_FLOW_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flow = url.searchParams.get("flow");
  const safeFlow = flow === "setup" || flow === "reset" ? flow : "reset";
  if (!config.siteUrl || !isSupabaseConfigured || !code) return redirectAfterRecovery("/login?error=recovery_unavailable", config.siteUrl || url.origin);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectAfterRecovery("/login?error=recovery_expired", config.siteUrl);

  const { data: { user } } = await supabase.auth.getUser();
  const exception = user?.email ? await getAccessException(user.email, supabase) : null;
  const profile = await provisionAuthenticatedProfile(user, supabase);
  const result = user ? await evaluateUserAccess(user, supabase) : { allowed: false };
  if (!user || usesMicrosoftAuthentication(user) || !exception || !profile || !result.allowed) {
    await supabase.auth.signOut();
    return redirectAfterRecovery("/access-denied", config.siteUrl);
  }

  return redirectAfterRecovery(`/auth/set-password?flow=${safeFlow}`, config.siteUrl);
}
