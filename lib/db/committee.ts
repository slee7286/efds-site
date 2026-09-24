import "server-only";

import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

export type CommitteeIdentity = {
  id: string;
  name: string;
  role: string;
  academicYear: string;
  accounts: { id: string; version: number; email: string; name: string | null }[];
};

export type UnlinkedProfile = { email: string; fullName: string | null; role: string };

export async function getCommitteeDirectory() {
  if (!isSupabaseConfigured) return { officers: [] as CommitteeIdentity[], unlinked: [] as UnlinkedProfile[], recentMembers: [] as UnlinkedProfile[] };
  await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const [officersResult, linkedResult, privilegedResult, membersResult] = await Promise.all([
    supabase.from("officers").select("id,name,role,academic_year").eq("active", true).order("name"),
    supabase.from("profiles").select("id,email,full_name,officer_id,access_version").eq("active", true).not("officer_id", "is", null),
    supabase.from("profiles").select("email,full_name,access_role,officer_id").eq("active", true).in("access_role", ["committee", "admin"]),
    supabase.from("profiles").select("email,full_name,access_role").eq("active", true).in("access_role", ["member", "efds_member"]).order("created_at", { ascending: false }).limit(12),
  ]);
  if (officersResult.error) throw officersResult.error;
  if (linkedResult.error) throw linkedResult.error;
  if (privilegedResult.error) throw privilegedResult.error;
  if (membersResult.error) throw membersResult.error;
  const byOfficer = new Map<string, CommitteeIdentity["accounts"]>();
  for (const profile of (linkedResult.data ?? []) as Row[]) {
    const officerId = String(profile.officer_id);
    const accounts = byOfficer.get(officerId) ?? [];
    accounts.push({
      id: String(profile.id), version: Number(profile.access_version),
      email: String(profile.email), name: profile.full_name ? String(profile.full_name) : null,
    });
    byOfficer.set(officerId, accounts);
  }
  const officers = ((officersResult.data ?? []) as Row[]).map((officer) => {
    return {
      id: String(officer.id), name: String(officer.name), role: String(officer.role),
      academicYear: String(officer.academic_year),
      accounts: (byOfficer.get(String(officer.id)) ?? []).sort((a, b) => a.email.localeCompare(b.email)),
    };
  });
  const unlinked = ((privilegedResult.data ?? []) as Row[]).filter((profile) => !profile.officer_id).map((profile) => ({ email: String(profile.email), fullName: profile.full_name ? String(profile.full_name) : null, role: String(profile.access_role) }));
  const recentMembers = ((membersResult.data ?? []) as Row[]).map((profile) => ({ email: String(profile.email), fullName: profile.full_name ? String(profile.full_name) : null, role: String(profile.access_role) }));
  return { officers, unlinked, recentMembers };
}
