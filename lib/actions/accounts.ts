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
  const { error } = await supabase.rpc("review_efds_account", {
    p_target_profile_id: profileId, p_expected_version: version, p_action: action,
    p_reason: null, p_officer_id: officerId || null,
  });
  if (error) {
    if (error.code === "40001" || error.message.includes("profile changed")) redirect("/admin/accounts?error=stale");
    if (error.message.includes("officer already linked")) redirect("/admin/accounts?error=officer_taken");
    redirect("/admin/accounts?error=review_failed");
  }
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/committee");
  redirect("/admin/accounts?status=all&notice=reviewed");
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
  redirect("/dashboard/profile?membership=saved");
}
