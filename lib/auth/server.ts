import "server-only";

import type { User } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "@/lib/config";
import { normalizeEmail, resolveAccess } from "@/lib/auth/access";
import type { AccessException, AccessProfile, AccessRole } from "@/types/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAuthUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getAccessException(email: string): Promise<AccessException | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("auth_access_exceptions").select("email, access_role, active, expires_at").eq("email", normalizeEmail(email)).maybeSingle();
  if (!data) return null;
  return { email: data.email, accessRole: data.access_role as AccessRole, active: data.active, expiresAt: data.expires_at };
}

export async function getApplicationProfile(user: User | null): Promise<AccessProfile | null> {
  if (!user?.email || !isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("profiles").select("auth_user_id, email, full_name, access_role, member_type, active").eq("auth_user_id", user.id).maybeSingle();
  if (!data || !data.active) return null;
  return {
    authUserId: data.auth_user_id,
    email: data.email,
    fullName: data.full_name,
    accessRole: data.access_role as AccessRole,
    memberType: data.member_type,
    active: data.active,
  };
}

export async function evaluateUserAccess(user: User | null) {
  if (!user?.email) return { allowed: false, profile: null };
  const exception = await getAccessException(user.email);
  const decision = resolveAccess(user.email, config.allowedEmailDomains, exception);
  const profile = await getApplicationProfile(user);
  return { allowed: decision.allowed && Boolean(profile?.active), profile, decision };
}

export async function upsertImperialProfile(user: User) {
  if (!user.email || !isSupabaseConfigured) return;
  const decision = resolveAccess(user.email, config.allowedEmailDomains);
  if (!decision.allowed) return;
  const supabase = await createServerSupabaseClient();
  await supabase.from("profiles").upsert({
    auth_user_id: user.id,
    email: normalizeEmail(user.email),
    full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    access_role: decision.accessRole,
    member_type: decision.memberType,
    active: true,
  }, { onConflict: "auth_user_id" });
}
