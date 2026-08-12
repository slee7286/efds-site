import { NextResponse } from "next/server";
import { config, isSupabaseConfigured } from "@/lib/config";
import { getAccessException } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flow = url.searchParams.get("flow") === "setup" ? "setup" : "reset";
  if (!config.siteUrl || !isSupabaseConfigured || !code) return NextResponse.redirect(new URL("/login?error=recovery_unavailable", config.siteUrl || url.origin));

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=recovery_failed", config.siteUrl));

  const { data: { user } } = await supabase.auth.getUser();
  const exception = user?.email ? await getAccessException(user.email) : null;
  if (!user || !exception) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/access-denied", config.siteUrl));
  }

  return NextResponse.redirect(new URL(`/auth/set-password?flow=${flow}`, config.siteUrl));
}
