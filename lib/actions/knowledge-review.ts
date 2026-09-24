"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/config";
import { requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { KnowledgeType, KnowledgeVisibility } from "@/types/domain";

const actionSchema = z.object({
  action: z.enum(["approve", "edit_approve", "reject", "needs_review", "supersede", "publish", "unpublish", "add_process_step", "remove_process_step", "link_resource", "unlink_resource"]),
  knowledgeType: z.enum(["requirement", "timing_rule", "process", "process_step", "resource", "contact"]),
  recordId: z.string().uuid(),
  expectedVersion: z.coerce.number().int().positive(),
  reason: z.string().trim().max(2000).optional(),
  reasonCode: z.string().trim().max(100).optional(),
  reasonNote: z.string().trim().max(2000).optional(),
  normalizedText: z.string().trim().max(10000).optional(),
  patch: z.string().max(20000).optional(),
  visibility: z.enum(["internal", "committee", "member", "public"]).optional(),
});

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function formStrings(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string");
}

function parsePatch(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("The editing payload is invalid"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("The editing payload is invalid");
  return parsed as Record<string, unknown>;
}

function defaultPatch(type: KnowledgeType, normalizedText: string | undefined) {
  if (!normalizedText) return {};
  const field: Record<KnowledgeType, string> = {
    requirement: "requirement_text",
    timing_rule: "description",
    process: "name",
    process_step: "instruction",
    resource: "name",
    contact: "description",
  };
  return { [field[type]]: normalizedText };
}

function collectFormPatch(type: KnowledgeType, formData: FormData) {
  const patch: Record<string, unknown> = {};
  const fields: Record<KnowledgeType, string[]> = {
    requirement: ["requirement_text", "requirement_type", "applies_to", "mandatory", "topic_id"],
    timing_rule: ["description", "deadline_type", "absolute_date", "notice_period_value", "notice_period_unit", "working_days", "recurrence_rule", "relative_to_event_type", "topic_id"],
    process: ["name", "description", "topic_id"],
    process_step: ["title", "instruction", "condition", "step_number"],
    resource: ["name", "resource_type", "url", "description", "topic_id"],
    contact: ["name", "organisation", "email", "url", "description"],
  };
  for (const field of fields[type]) {
    const value = formString(formData, field);
    if (value !== undefined) patch[field] = field === "mandatory" || field === "working_days" ? value === "true" : value;
  }
  return patch;
}

function revalidateKnowledge() {
  revalidatePath("/admin/knowledge");
  revalidatePath("/admin/knowledge/review");
  revalidatePath("/admin/knowledge/stale");
  revalidatePath("/admin/knowledge/requirements");
  revalidatePath("/admin/knowledge/timing");
  revalidatePath("/admin/knowledge/processes");
  revalidatePath("/admin/knowledge/resources");
  revalidatePath("/dashboard/knowledge");
  revalidatePath("/resources");
}

function mutationMessage(code: string | undefined) {
  switch (code) {
    case "P0001": return "You are not authorised to review knowledge.";
    case "P0002": return "Your EFDS profile is inactive.";
    case "P0003": return "The knowledge record was not found.";
    case "P0004": return "That review transition is not valid.";
    case "P0005": return "Only approved, current knowledge can be published.";
    case "P0006": return "This record changed since you opened it.";
    case "P0007": return "That visibility level is not valid.";
    case "P0008": return "The review input is invalid.";
    default: return "The knowledge review could not be saved.";
  }
}

async function runReviewMutation(formData: FormData, options: { redirectOnConflict?: boolean } = {}) {
  if (!isSupabaseConfigured) throw new Error("Knowledge review mutations require Supabase configuration");
  const parsed = actionSchema.parse({
    action: formString(formData, "action"),
    knowledgeType: formString(formData, "knowledgeType"),
    recordId: formString(formData, "recordId"),
    expectedVersion: formString(formData, "expectedVersion"),
    reason: formString(formData, "reason"),
    reasonCode: formString(formData, "reasonCode"),
    reasonNote: formString(formData, "reasonNote"),
    normalizedText: formString(formData, "normalizedText"),
    patch: formString(formData, "patch"),
    visibility: formString(formData, "visibility"),
  });
  const submittedPatch = parsePatch(parsed.patch);
  const formPatch = collectFormPatch(parsed.knowledgeType, formData);
  if (parsed.action === "reject" && !parsed.reason && !parsed.reasonCode && !parsed.reasonNote) throw new Error("A rejection reason is required");
  if (parsed.action === "edit_approve" && !parsed.normalizedText && !Object.keys(submittedPatch).length && !Object.keys(formPatch).length) throw new Error("Edited knowledge cannot be empty");
  if (parsed.action === "publish" && !parsed.visibility) throw new Error("Choose a visibility level");

  await requireRole("admin");
  const patch = { ...defaultPatch(parsed.knowledgeType, parsed.normalizedText), ...submittedPatch, ...formPatch };
  const roleIds = formStrings(formData, "roleId");
  if (roleIds.length) patch.role_ids = roleIds;
  if (parsed.action === "add_process_step") {
    for (const field of ["title", "instruction", "condition"]) {
      const value = formString(formData, field);
      if (value !== undefined) patch[field] = value;
    }
  }
  if ((parsed.action === "link_resource" || parsed.action === "unlink_resource") && formString(formData, "resource_id")) patch.resource_id = formString(formData, "resource_id");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("review_knowledge_transaction", {
    p_knowledge_type: parsed.knowledgeType,
    p_knowledge_record_id: parsed.recordId,
    p_action: parsed.action,
    p_expected_version: parsed.expectedVersion,
    p_patch: patch,
    p_reason_code: parsed.reasonCode ?? parsed.reason ?? null,
    p_reason_note: parsed.reasonNote ?? null,
    p_visibility: parsed.visibility ?? null,
  });
  if (error) {
    const message = mutationMessage(error.code);
    if (error.code === "P0006" && options.redirectOnConflict !== false) redirect(`/admin/knowledge/review/${parsed.knowledgeType}/${parsed.recordId}?error=concurrency_conflict`);
    throw new Error(message);
  }
  revalidateKnowledge();
  return data as { record: Record<string, unknown>; event_id: string; review_version: number };
}

export async function reviewKnowledgeAction(formData: FormData): Promise<void> {
  await runReviewMutation(formData);
  const knowledgeType = formString(formData, "knowledgeType");
  const recordId = formString(formData, "recordId");
  if (knowledgeType && recordId) redirect(`/admin/knowledge/review/${knowledgeType}/${recordId}?saved=${formString(formData, "action") ?? "change"}&confirmation=${crypto.randomUUID()}`);
}

export async function bulkReviewKnowledgeAction(formData: FormData): Promise<void> {
  const action = formString(formData, "bulkAction");
  if (action !== "approve" && action !== "needs_review") throw new Error("Bulk review only supports approve or needs review");
  const selections = formData.getAll("selection").filter((value): value is string => typeof value === "string");
  if (!selections.length || selections.length > 25) throw new Error("Select between 1 and 25 valid knowledge records");
  const results: { successful: string[]; conflicted: string[]; failed: string[] } = { successful: [], conflicted: [], failed: [] };
  for (const selection of selections) {
    const [knowledgeType, recordId, expectedVersion] = selection.split(":");
    if (!knowledgeType || !recordId || !expectedVersion) throw new Error("Invalid bulk knowledge selection");
    const item = new FormData();
    item.set("action", action);
    item.set("recordId", recordId);
    item.set("knowledgeType", knowledgeType);
    item.set("expectedVersion", expectedVersion);
    try {
      await runReviewMutation(item, { redirectOnConflict: false });
      results.successful.push(recordId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("changed since")) results.conflicted.push(recordId);
      else results.failed.push(recordId);
    }
  }
  redirect(`/admin/knowledge/review?bulk_success=${results.successful.join(",")}&bulk_conflicted=${results.conflicted.join(",")}&bulk_failed=${results.failed.join(",")}`);
}

export type KnowledgeMutationVisibility = KnowledgeVisibility;
