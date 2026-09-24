import "server-only";

import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AccessRole, EfdsVerificationStatus } from "@/types/domain";

export type ReviewAccount = {
  id: string;
  email: string;
  fullName: string | null;
  role: AccessRole;
  memberType: string;
  verificationStatus: EfdsVerificationStatus;
  claim: string | null;
  officerId: string | null;
  version: number;
  createdAt: string;
  verifiedAt: string | null;
};

export type OfficerOption = { id: string; name: string; role: string; academicYear: string };
export type AccountAccessEvent = { id: string; action: string; targetProfileId: string; actorProfileId: string; occurredAt: string; reason: string | null };
export type AccountNoticeHealth = {
  pending: number;
  sending: number;
  accepted7d: number;
  needsAttention: number;
  oldestPendingAt: string | null;
};

export async function getAccountNoticeHealth(): Promise<AccountNoticeHealth | null> {
  if (!isSupabaseConfigured) return null;
  await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("account_status_notice_health");
  if (error || !Array.isArray(data) || !data[0]) return null;
  const row = data[0];
  return {
    pending: Number(row.pending), sending: Number(row.sending),
    accepted7d: Number(row.accepted_7d), needsAttention: Number(row.needs_attention),
    oldestPendingAt: row.oldest_pending_at ? String(row.oldest_pending_at) : null,
  };
}

export async function getAccountReviewData(status: "pending" | "standard" | "all" = "pending", page = 1) {
  const empty = { accounts: [] as ReviewAccount[], officers: [] as OfficerOption[], events: [] as AccountAccessEvent[], pendingCount: 0, standardCount: 0, accountCount: 0 };
  if (!isSupabaseConfigured) return empty;
  await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const pageSize = 25;
  let query = supabase.from("profiles")
    .select("id,email,full_name,access_role,member_type,efds_verification_status,efds_verification_claim,officer_id,access_version,created_at,efds_verified_at", { count: "exact" })
    .eq("active", true).order("created_at", { ascending: false });
  if (status === "pending") query = query.eq("efds_verification_status", "pending").not("efds_verification_claim", "is", null);
  if (status === "standard") query = query.eq("efds_verification_status", "declined").eq("access_role", "member");
  query = query.range((page - 1) * pageSize, page * pageSize - 1);
  const [profiles, officers, events, pending, standard] = await Promise.all([
    query,
    supabase.from("officers").select("id,name,role,academic_year").eq("active", true).order("name"),
    supabase.from("account_access_events").select("id,action,target_profile_id,actor_profile_id,occurred_at,reason").order("occurred_at", { ascending: false }).limit(20),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("active", true).eq("efds_verification_status", "pending").not("efds_verification_claim", "is", null),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("active", true).eq("efds_verification_status", "declined").eq("access_role", "member"),
  ]);
  for (const result of [profiles, officers, events, pending, standard]) if (result.error) throw result.error;
  return {
    accounts: (profiles.data ?? []).map((row) => ({
      id: String(row.id), email: String(row.email), fullName: row.full_name ? String(row.full_name) : null,
      role: row.access_role as AccessRole, memberType: String(row.member_type),
      verificationStatus: row.efds_verification_status as EfdsVerificationStatus,
      claim: row.efds_verification_claim ? String(row.efds_verification_claim) : null,
      officerId: row.officer_id ? String(row.officer_id) : null,
      version: Number(row.access_version), createdAt: String(row.created_at),
      verifiedAt: row.efds_verified_at ? String(row.efds_verified_at) : null,
    })),
    officers: (officers.data ?? []).map((row) => ({ id: String(row.id), name: String(row.name), role: String(row.role), academicYear: String(row.academic_year) })),
    events: (events.data ?? []).map((row) => ({ id: String(row.id), action: String(row.action), targetProfileId: String(row.target_profile_id), actorProfileId: String(row.actor_profile_id), occurredAt: String(row.occurred_at), reason: row.reason ? String(row.reason) : null })),
    pendingCount: pending.count ?? 0,
    standardCount: standard.count ?? 0,
    accountCount: profiles.count ?? 0,
  };
}
