"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const linkSchema = z.object({
  officerId: z.uuid(),
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
});
const unlinkSchema = z.object({ officerId: z.uuid(), profileId: z.uuid(), version: z.coerce.number().int().positive() });

type Client = Awaited<ReturnType<typeof createServerSupabaseClient>>;

async function finishLink(client: Client, profileId: string, version: number, officerId: string | null, notice: "linked" | "unlinked") {
  const { data, error } = await client.rpc("review_efds_account", {
    p_target_profile_id: profileId,
    p_expected_version: version,
    p_action: "link_officer",
    p_reason: null,
    p_officer_id: officerId,
  });
  if (error) {
    if (error.code === "40001" || error.message.includes("profile changed")) redirect("/admin/committee?error=stale");
    if (error.message.includes("officer account limit reached") || error.message.includes("officer already linked")) redirect("/admin/committee?error=officer_full");
    if (error.message.includes("committee role required")) redirect("/admin/committee?error=committee_required");
    redirect("/admin/committee?error=save_failed");
  }
  const savedVersion = Number(Array.isArray(data) ? data[0]?.access_version : undefined);
  let mail = "unavailable";
  if (Number.isInteger(savedVersion)) {
    const { data: state, error: stateError } = await client.rpc("account_status_notice_state", {
      p_profile_id: profileId,
      p_access_version: savedVersion,
    });
    if (!stateError) {
      mail = state === "accepted" ? "accepted"
        : state === "pending" || state === "sending" ? "queued"
        : state === "rejected" || state === "uncertain" ? "attention"
        : "unavailable";
    }
  }
  revalidatePath("/admin/committee");
  revalidatePath("/admin/accounts");
  revalidatePath("/dashboard/profile");
  redirect(`/admin/committee?notice=${notice}&mail=${mail}&confirmation=${crypto.randomUUID()}#roster`);
}

export async function linkOfficerAccount(formData: FormData) {
  await requireRole("admin");
  const parsed = linkSchema.safeParse({ officerId: formData.get("officerId"), email: formData.get("email") });
  if (!parsed.success) redirect("/admin/committee?error=invalid_request#roster");
  const client = await createServerSupabaseClient();
  const { data: profile, error } = await client.from("profiles")
    .select("id,access_role,access_version,officer_id")
    .eq("email", parsed.data.email).eq("active", true).maybeSingle();
  if (error) redirect("/admin/committee?error=save_failed#roster");
  if (!profile) redirect("/admin/committee?error=account_missing#roster");
  if (profile.access_role !== "committee" && profile.access_role !== "admin") redirect("/admin/committee?error=committee_required#roster");
  if (profile.officer_id === parsed.data.officerId) redirect("/admin/committee?notice=already_linked#roster");
  if (profile.officer_id) redirect("/admin/committee?error=account_linked#roster");
  await finishLink(client, String(profile.id), Number(profile.access_version), parsed.data.officerId, "linked");
}

export async function unlinkOfficerAccount(formData: FormData) {
  await requireRole("admin");
  const parsed = unlinkSchema.safeParse({
    officerId: formData.get("officerId"), profileId: formData.get("profileId"), version: formData.get("version"),
  });
  if (!parsed.success) redirect("/admin/committee?error=invalid_request#roster");
  const client = await createServerSupabaseClient();
  const { data: profile, error } = await client.from("profiles")
    .select("officer_id,access_version").eq("id", parsed.data.profileId).eq("active", true).maybeSingle();
  if (error || !profile) redirect("/admin/committee?error=save_failed#roster");
  if (profile.officer_id !== parsed.data.officerId || Number(profile.access_version) !== parsed.data.version) redirect("/admin/committee?error=stale#roster");
  await finishLink(client, parsed.data.profileId, parsed.data.version, null, "unlinked");
}
