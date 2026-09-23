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
  profileEmail: string | null;
  profileName: string | null;
};

export type UnlinkedProfile = { email: string; fullName: string | null; role: string };

export async function getCommitteeDirectory() {
  if (!isSupabaseConfigured) return { officers: [] as CommitteeIdentity[], unlinked: [] as UnlinkedProfile[], recentMembers: [] as UnlinkedProfile[] };
  await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const [officersResult, linkedResult, privilegedResult, membersResult] = await Promise.all([
    supabase.from("officers").select("id,name,role,academic_year").eq("active", true).order("name"),
    supabase.from("profiles").select("email,full_name,officer_id").eq("active", true).not("officer_id", "is", null),
    supabase.from("profiles").select("email,full_name,access_role,officer_id").eq("active", true).in("access_role", ["committee", "admin"]),
    supabase.from("profiles").select("email,full_name").eq("active", true).eq("access_role", "member").order("created_at", { ascending: false }).limit(12),
  ]);
  if (officersResult.error) throw officersResult.error;
  if (linkedResult.error) throw linkedResult.error;
  if (privilegedResult.error) throw privilegedResult.error;
  if (membersResult.error) throw membersResult.error;
  const byOfficer = new Map(((linkedResult.data ?? []) as Row[]).map((profile) => [String(profile.officer_id), profile]));
  const officers = ((officersResult.data ?? []) as Row[]).map((officer) => {
    const profile = byOfficer.get(String(officer.id));
    return {
      id: String(officer.id), name: String(officer.name), role: String(officer.role),
      academicYear: String(officer.academic_year),
      profileEmail: profile ? String(profile.email) : null,
      profileName: profile?.full_name ? String(profile.full_name) : null,
    };
  });
  const unlinked = ((privilegedResult.data ?? []) as Row[]).filter((profile) => !profile.officer_id).map((profile) => ({ email: String(profile.email), fullName: profile.full_name ? String(profile.full_name) : null, role: String(profile.access_role) }));
  const recentMembers = ((membersResult.data ?? []) as Row[]).map((profile) => ({ email: String(profile.email), fullName: profile.full_name ? String(profile.full_name) : null, role: "member" }));
  return { officers, unlinked, recentMembers };
}
