import "server-only";

import type { User } from "@supabase/supabase-js";
import { config, isSupabaseConfigured } from "@/lib/config";
import { isActiveException, isAllowedImperialEmail, normalizeEmail } from "@/lib/auth/access";
import { hasMinimumRole } from "@/lib/auth/roles";
import type { AccessException, AccessProfile, AccessRole } from "@/types/domain";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type ServerSupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export class AuthorizationError extends Error {
  constructor(message = "An active EFDS profile is required") {
    super(message);
    this.name = "AuthorizationError";
  }
}

const roleRank: Record<AccessRole, number> = { viewer: 1, member: 2, committee: 3, admin: 4 };

export function usesMicrosoftAuthentication(user: User | null) {
  if (!user) return false;
  const provider = user.app_metadata?.provider;
  return provider === "azure" || user.identities?.some((identity) => identity.provider === "azure") === true;
}

function requiresException(user: User | null) {
  if (!user?.email) return false;
  return !isAllowedImperialEmail(user.email, config.allowedEmailDomains) || !usesMicrosoftAuthentication(user);
}

export async function getAuthUser(client?: ServerSupabaseClient) {
  if (!isSupabaseConfigured) return null;
  const supabase = client ?? await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export const getCurrentUser = getAuthUser;

export async function getAccessException(email: string, client?: ServerSupabaseClient): Promise<AccessException | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = client ?? await createServerSupabaseClient();
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

export function resolveAuthenticatedAccess(user: User, exception: AccessException | null) {
  if (isAllowedImperialEmail(user.email ?? "", config.allowedEmailDomains) && usesMicrosoftAuthentication(user)) {
    return { allowed: true, accessRole: "member" as AccessRole, memberType: "imperial" as const };
  }
  if (exception && isActiveException(exception)) {
    return { allowed: true, accessRole: exception.accessRole, memberType: "external" as const };
  }
  return { allowed: false, accessRole: null, memberType: null };
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

async function getStoredProfile(user: User | null, client?: ServerSupabaseClient): Promise<AccessProfile | null> {
  if (!user?.id || !isSupabaseConfigured) return null;
  const supabase = client ?? await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, auth_user_id, email, full_name, access_role, member_type, officer_id, active, last_login_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfile(data as Record<string, unknown>);
}

export async function getApplicationProfile(user: User | null, client?: ServerSupabaseClient): Promise<AccessProfile | null> {
  const profile = await getStoredProfile(user, client);
  if (!profile?.active || !user?.email) return null;
  return profile.email === normalizeEmail(user.email) ? profile : null;
}

export const getCurrentProfile = async () => getApplicationProfile(await getAuthUser());

export async function evaluateUserAccess(user: User | null, client?: ServerSupabaseClient) {
  const email = user?.email;
  const emailIsUsable = Boolean(email && (user.email_confirmed_at ?? user.confirmed_at));
  if (!email || !emailIsUsable) return { allowed: false, profile: null, decision: null };
  const exception = requiresException(user) ? await getAccessException(email, client) : null;
  const decision = resolveAuthenticatedAccess(user, exception);
  const profile = await getApplicationProfile(user, client);
  return { allowed: decision.allowed && Boolean(profile?.active), profile, decision };
}

export async function provisionAuthenticatedProfile(user: User | null, client?: ServerSupabaseClient) {
  if (!user?.email || !isSupabaseConfigured || !(user.email_confirmed_at ?? user.confirmed_at)) return null;
  const normalizedEmail = normalizeEmail(user.email);
  const exception = requiresException(user) ? await getAccessException(normalizedEmail, client) : null;
  const decision = resolveAuthenticatedAccess(user, exception);
  const existing = await getStoredProfile(user, client);
  if (!decision.allowed || existing && !existing.active) return null;

  const supabase = client ?? await createServerSupabaseClient();
  const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? null;
  const lastLoginAt = new Date().toISOString();
  const isImperialMicrosoft = isAllowedImperialEmail(normalizedEmail, config.allowedEmailDomains) && usesMicrosoftAuthentication(user);

  if (existing) {
    const promoteRole = decision.accessRole && roleRank[decision.accessRole] > roleRank[existing.accessRole]
      ? { access_role: decision.accessRole }
      : {};
    const { data, error } = await supabase
      .from("profiles")
      .update({ email: normalizedEmail, full_name: fullName, member_type: isImperialMicrosoft ? "imperial" : existing.memberType, last_login_at: lastLoginAt, ...promoteRole })
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
      member_type: isImperialMicrosoft ? "imperial" : decision.memberType,
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
