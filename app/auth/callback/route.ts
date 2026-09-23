import { NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { evaluateUserAccess, provisionAuthenticatedProfile } from "@/lib/auth/server";
import { safeInternalPath } from "@/lib/auth/redirect";
import { EMAIL_FLOW_COOKIE } from "@/lib/auth/email-flow";

function redirectAfterAuth(path: string) {
  const response = NextResponse.redirect(new URL(path, config.siteUrl));
  response.cookies.delete(EMAIL_FLOW_COOKIE);
  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!config.siteUrl) return new NextResponse("NEXT_PUBLIC_SITE_URL is required", { status: 500 });
  if (!code || !isSupabaseConfigured) return redirectAfterAuth("/login?error=auth_unconfigured");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return redirectAfterAuth("/login?error=auth_failed");
  const { data: { user } } = await supabase.auth.getUser();
  await provisionAuthenticatedProfile(user, supabase);
  const { allowed } = await evaluateUserAccess(user, supabase);
  if (!allowed) await supabase.auth.signOut();
  const destination = allowed ? safeInternalPath(url.searchParams.get("next")) ?? "/dashboard" : "/access-denied";
  return redirectAfterAuth(destination);
}
