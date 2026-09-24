"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuthenticatedProfile, requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  profileId: z.uuid(),
  version: z.coerce.number().int().positive(),
  action: z.enum(["verify", "decline", "promote_committee", "promote_admin", "demote_member", "link_officer"]),
  officerId: z.uuid().optional(),
});

export async function reviewAccount(formData: FormData) {
  await requireRole("admin");
  const parsed = reviewSchema.safeParse({
    profileId: formData.get("profileId"), version: formData.get("version"),
    action: formData.get("action"), officerId: formData.get("officerId") || undefined,
  });
  if (!parsed.success) redirect("/admin/accounts?error=invalid_request");
  const { profileId, version, action, officerId } = parsed.data;
  if (action === "link_officer" && !officerId) redirect("/admin/accounts?error=officer_required");
  const supabase = await createServerSupabaseClient();
  const { data: decision, error } = await supabase.rpc("review_efds_account", {
    p_target_profile_id: profileId, p_expected_version: version, p_action: action,
    p_reason: null, p_officer_id: officerId || null,
  });
  if (error) {
    if (error.code === "40001" || error.message.includes("profile changed")) redirect("/admin/accounts?error=stale");
    if (error.message.includes("officer account limit reached") || error.message.includes("officer already linked")) redirect("/admin/accounts?error=officer_full");
    redirect("/admin/accounts?error=review_failed");
  }
  const savedVersion = Number(Array.isArray(decision) ? decision[0]?.access_version : undefined);
  let notice = "unavailable";
  if (Number.isInteger(savedVersion)) {
    const { data: state, error: stateError } = await supabase.rpc("account_status_notice_state", {
      p_profile_id: profileId, p_access_version: savedVersion,
    });
    if (!stateError) {
      notice = state === "accepted" ? "accepted"
        : state === "pending" || state === "sending" ? "queued"
        : state === "rejected" || state === "uncertain" ? "attention"
        : "unchanged";
    }
  }
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/committee");
  redirect(`/admin/accounts?status=${action === "decline" ? "standard" : "all"}&notice=${notice}&confirmation=${crypto.randomUUID()}`);
}

const claimSchema = z.string().trim().min(10).max(500);

export async function requestMembershipReview(formData: FormData) {
  const { profile } = await requireAuthenticatedProfile();
  if (profile.accessRole !== "member" || profile.verificationStatus === "approved") redirect("/dashboard/profile?membership=unavailable");
  const parsed = claimSchema.safeParse(formData.get("claim"));
  if (!parsed.success) redirect("/dashboard/profile?membership=invalid");
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("profiles")
    .update({ efds_verification_claim: parsed.data })
    .eq("id", profile.id);
  if (error) redirect("/dashboard/profile?membership=failed");
  revalidatePath("/dashboard/profile");
  revalidatePath("/admin/accounts");
  redirect(`/dashboard/profile?membership=saved&confirmation=${crypto.randomUUID()}`);
}
