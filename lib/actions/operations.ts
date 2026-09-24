"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/config";
import { requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const types = ["decision", "action_item", "commitment", "open_question", "status_update"] as const;
const actions = ["create", "approve", "edit", "edit_approve", "reject", "defer", "publish", "unpublish", "assign_owner", "change_due_date", "change_execution_status", "complete", "reopen", "resolve", "supersede", "attach_evidence", "detach_evidence"] as const;
const schema = z.object({ action: z.enum(actions), recordType: z.enum(types).optional(), recordId: z.string().uuid().optional(), expectedVersion: z.coerce.number().int().positive().optional(), patch: z.string().max(30000).optional(), reason: z.string().trim().max(2000).optional(), visibility: z.enum(["internal", "committee", "member", "public"]).optional() });

function value(form: FormData, key: string) { const item = form.get(key); return typeof item === "string" ? item : undefined; }
function parsePatch(raw?: string) { if (!raw) return {}; try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(); return parsed as Record<string, unknown>; } catch { throw new Error("The operational record input is invalid"); } }

function errorMessage(code?: string) {
  switch (code) {
    case "P0001": return "You are not authorised to change operational records.";
    case "P0003": return "The operational record or evidence was not found.";
    case "P0004": return "That operational transition is not valid.";
    case "P0005": return "Only approved, current records can be published.";
    case "P0006": return "This record changed since you opened it. Reload before saving.";
    case "P0007": return "That visibility level is not valid.";
    case "P0008": return "The operational record input is invalid.";
    default: return "The operational record could not be saved.";
  }
}

function refresh(id?: string) { revalidatePath("/admin/operations"); revalidatePath("/admin/operations/decisions"); revalidatePath("/admin/operations/actions"); revalidatePath("/admin/operations/questions"); revalidatePath("/admin/operations/timeline"); if (id) revalidatePath(`/admin/operations/${id}`); }

export async function operationalRecordAction(formData: FormData) {
  if (!isSupabaseConfigured) throw new Error("Operational record mutations require Supabase configuration");
  const parsed = schema.parse({ action: value(formData, "action"), recordType: value(formData, "recordType"), recordId: value(formData, "recordId") || undefined, expectedVersion: value(formData, "expectedVersion") || undefined, patch: value(formData, "patch"), reason: value(formData, "reason"), visibility: value(formData, "visibility") });
  await requireRole("admin");
  const patch = parsePatch(parsed.patch);
  const collectedFields = ["title", "description", "priority", "owner_profile_id", "owner_officer_id", "owner_text", "due_at", "due_text", "occurred_at", "workstream", "execution_status", "superseded_by_id"];
  for (const field of collectedFields) { const submitted = value(formData, field); if (submitted !== undefined) patch[field] = submitted; }
  if (parsed.visibility) patch.visibility = parsed.visibility;
  if (parsed.action === "create") {
    if (!parsed.recordType || patch.title === undefined) throw new Error("A type and title are required");
    patch.record_type = parsed.recordType;
  }
  if (parsed.action === "reject" && !parsed.reason) throw new Error("A rejection reason is required");
  const supabase = await createServerSupabaseClient();
  if (parsed.action === "publish") {
    if (!parsed.recordId) throw new Error("Choose an operational record to publish.");
    const source = await supabase.from("operational_records").select("metadata").eq("id", parsed.recordId).single();
    if (source.error) throw new Error("The operational record could not be checked before publication.");
    if (source.data?.metadata?.origin === "agent_ticket_suggestion" && patch.visibility !== "committee") {
      throw new Error("AI-suggested tickets can only be published to the committee workspace.");
    }
  }
  const { data, error } = await supabase.rpc("mutate_operational_record", { p_action: parsed.action, p_record_id: parsed.recordId ?? null, p_expected_version: parsed.expectedVersion ?? null, p_patch: patch, p_reason: parsed.reason ?? null });
  if (error) { if (error.code === "P0006" && parsed.recordId) redirect(`/admin/operations/${parsed.recordId}?error=concurrency_conflict`); throw new Error(errorMessage(error.code)); }
  const record = data && typeof data === "object" ? (data as Record<string, unknown>).record : null;
  const recordId = String(record && typeof record === "object" ? (record as Record<string, unknown>).id ?? parsed.recordId ?? "" : parsed.recordId ?? "");
  refresh(recordId);
  redirect(`/admin/operations/${recordId}?saved=${parsed.action}&confirmation=${crypto.randomUUID()}`);
}
