import "server-only";

import type { User } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "@/lib/config";
import { isAllowedImperialEmail, normalizeEmail, resolveAccess } from "@/lib/auth/access";
import { hasMinimumRole } from "@/lib/auth/roles";
import type { AccessException, AccessProfile, AccessRole } from "@/types/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export class AuthorizationError extends Error {
  constructor(message = "An active EFDS profile is required") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function getAuthUser() {
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export const getCurrentUser = getAuthUser;

export async function getAccessException(email: string): Promise<AccessException | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  // The RLS-protected table is never selected directly. This RPC only returns
  // the current authenticated identity's effective role, not the exception row.
  const { data, error } = await supabase.rpc("current_efds_external_access_role");
  if (error || typeof data !== "string") return null;
  return {
    email: normalizeEmail(email),
    accessRole: data as AccessRole,
    memberType: "external",
    active: true,
  };
}

function mapProfile(data: Record<string, unknown>): AccessProfile {
  return {
    id: String(data.id),
    authUserId: String(data.auth_user_id),
    email: String(data.email),
    fullName: (data.full_name as string | null) ?? null,
    accessRole: data.access_role as AccessRole,
    memberType: data.member_type as AccessProfile["memberType"],
    officerId: (data.officer_id as string | null) ?? null,
    active: Boolean(data.active),
    lastLoginAt: (data.last_login_at as string | null) ?? null,
  };
}

async function getStoredProfile(user: User | null): Promise<AccessProfile | null> {
  if (!user?.id || !isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, auth_user_id, email, full_name, access_role, member_type, officer_id, active, last_login_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data as Record<string, unknown>);
}

export async function getApplicationProfile(user: User | null): Promise<AccessProfile | null> {
  const profile = await getStoredProfile(user);
  if (!profile?.active || !user?.email) return null;
  return profile.email === normalizeEmail(user.email) ? profile : null;
}

export const getCurrentProfile = async () => getApplicationProfile(await getAuthUser());

export async function evaluateUserAccess(user: User | null) {
  const email = user?.email;
  const emailIsUsable = Boolean(email && (user.email_confirmed_at ?? user.confirmed_at));
  if (!email || !emailIsUsable) return { allowed: false, profile: null, decision: null };
  const exception = isAllowedImperialEmail(email, config.allowedEmailDomains)
    ? null
    : await getAccessException(email);
  const decision = resolveAccess(email, config.allowedEmailDomains, exception);
  const profile = await getApplicationProfile(user);
  return { allowed: decision.allowed && Boolean(profile?.active), profile, decision };
}

export async function provisionAuthenticatedProfile(user: User | null) {
  if (!user?.email || !isSupabaseConfigured || !(user.email_confirmed_at ?? user.confirmed_at)) return null;
  const normalizedEmail = normalizeEmail(user.email);
  const exception = isAllowedImperialEmail(normalizedEmail, config.allowedEmailDomains)
    ? null
    : await getAccessException(normalizedEmail);
  const decision = resolveAccess(normalizedEmail, config.allowedEmailDomains, exception);
  const existing = await getStoredProfile(user);
  if (!decision.allowed || existing && !existing.active) return null;

  const supabase = await createServerSupabaseClient();
  const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
  const lastLoginAt = new Date().toISOString();
  const isImperial = isAllowedImperialEmail(normalizedEmail, config.allowedEmailDomains);

  if (existing) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ email: normalizedEmail, full_name: fullName, member_type: isImperial ? "imperial" : existing.memberType, last_login_at: lastLoginAt })
      .eq("auth_user_id", user.id)
      .select("id, auth_user_id, email, full_name, access_role, member_type, officer_id, active, last_login_at")
      .single();
    if (error || !data) return null;
    return mapProfile(data as Record<string, unknown>);
  }

  // An exception explicitly granting admin cannot self-provision an admin
  // profile. Bootstrap that profile through grant_access.py instead.
  if (decision.accessRole === "admin") return null;
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_id: user.id,
      email: normalizedEmail,
      full_name: fullName,
      access_role: decision.accessRole,
      member_type: decision.memberType,
      active: true,
      last_login_at: lastLoginAt,
    })
    .select("id, auth_user_id, email, full_name, access_role, member_type, officer_id, active, last_login_at")
    .single();
  if (error || !data) return null;
  return mapProfile(data as Record<string, unknown>);
}

// Kept as a compatibility name for callers from the initial V1 callback.
export const upsertImperialProfile = provisionAuthenticatedProfile;

export async function requireAuthenticatedProfile() {
  const user = await getAuthUser();
  const profile = await getApplicationProfile(user);
  if (!user || !profile) throw new AuthorizationError();
  return { user, profile };
}

export async function requireRole(requiredRole: AccessRole) {
  const result = await requireAuthenticatedProfile();
  if (!hasMinimumRole(result.profile.accessRole, requiredRole)) {
    throw new AuthorizationError(`The ${requiredRole} role is required`);
  }
  return result;
}
