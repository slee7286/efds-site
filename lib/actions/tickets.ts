"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const actionSchema = z.enum(["create", "update", "assign", "status"]);
const statusSchema = z.enum(["open", "in_progress", "blocked", "completed", "cancelled"]);
const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const idsSchema = z.array(z.string().uuid()).max(20);
const dateSchema = z.union([z.literal(""), z.iso.date()]);

function value(form: FormData, key: string) { const item = form.get(key); return typeof item === "string" ? item.trim() : ""; }
function dateAtEndOfDay(raw: string) {
  const date = dateSchema.parse(raw);
  return date ? `${date}T23:59:59Z` : "";
}

export async function ticketAction(formData: FormData) {
  const action = actionSchema.safeParse(value(formData, "action"));
  const ticketId = z.string().uuid().safeParse(value(formData, "ticketId"));
  const location = ticketId.success ? `/dashboard/tickets/${ticketId.data}` : "/dashboard/tickets/new";
  if (!action.success) redirect(`${location}?error=invalid`);
  if (!isSupabaseConfigured) redirect(`${location}?error=unavailable`);
  await requireRole("committee");

  let patch: Record<string, unknown>;
  try {
    if (action.data === "create" || action.data === "update") {
      const title = z.string().min(1).max(300).parse(value(formData, "title"));
      const description = z.string().max(5000).parse(value(formData, "description"));
      const workstream = z.string().max(100).parse(value(formData, "workstream"));
      const priority = prioritySchema.parse(value(formData, "priority"));
      patch = { title, description, workstream, priority, due_at: dateAtEndOfDay(value(formData, "dueDate")) };
      if (action.data === "create") patch.assignee_ids = idsSchema.parse(formData.getAll("assigneeIds"));
    } else if (action.data === "assign") {
      patch = { assignee_ids: idsSchema.parse(formData.getAll("assigneeIds")) };
    } else {
      patch = { execution_status: statusSchema.parse(value(formData, "status")) };
    }
  } catch {
    redirect(`${location}?error=invalid`);
  }
  const version = action.data === "create" ? null : z.coerce.number().int().positive().safeParse(value(formData, "expectedVersion"));
  if (action.data !== "create" && (!ticketId.success || !version || !version.success)) redirect(`${location}?error=invalid`);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("mutate_committee_ticket", {
    p_action: action.data,
    p_ticket_id: ticketId.success ? ticketId.data : null,
    p_expected_version: version && version.success ? version.data : null,
    p_patch: patch,
  });
  if (error) {
    const code = error.code === "P0006" ? "conflict" : error.code === "P0001" ? "forbidden" : error.code === "P0008" ? "invalid" : "save_failed";
    redirect(`${location}?error=${code}`);
  }
  const record = data && typeof data === "object" ? (data as Record<string, unknown>).record : null;
  const returnedId = record && typeof record === "object" ? (record as Record<string, unknown>).id : null;
  const finalId = typeof returnedId === "string" && z.string().uuid().safeParse(returnedId).success ? returnedId : ticketId.success ? ticketId.data : null;
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tickets");
  if (finalId) revalidatePath(`/dashboard/tickets/${finalId}`);
  redirect(finalId ? `/dashboard/tickets/${finalId}?saved=${action.data}` : "/dashboard/tickets");
}

export async function committeeSuggestionAction(formData: FormData) {
  const location = "/dashboard/tickets";
  if (!isSupabaseConfigured) redirect(`${location}?error=unavailable`);
  await requireRole("committee");
  let patch: Record<string, unknown>;
  let unitId: string;
  try {
    if (value(formData, "reviewedSource") !== "yes") throw new Error("source review required");
    unitId = z.string().uuid().parse(value(formData, "retrievalUnitId"));
    patch = {
      title: z.string().min(1).max(300).parse(value(formData, "title")),
      description: z.string().min(1).max(5000).parse(value(formData, "description")),
      workstream: z.string().max(100).parse(value(formData, "workstream")),
      priority: prioritySchema.parse(value(formData, "priority")),
      assignee_ids: idsSchema.parse(formData.getAll("assigneeIds")),
    };
  } catch {
    redirect(`${location}?error=invalid`);
  }
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_committee_ticket_from_evidence", {
    p_patch: patch,
    p_unit_id: unitId,
  });
  if (error) {
    const code = error.code === "P0007" ? "duplicate" : error.code === "P0001" ? "forbidden" : error.code === "P0008" ? "invalid" : "save_failed";
    redirect(`${location}?error=${code}`);
  }
  const record = data && typeof data === "object" ? (data as Record<string, unknown>).record : null;
  const returnedId = record && typeof record === "object" ? (record as Record<string, unknown>).id : null;
  if (typeof returnedId !== "string" || !z.string().uuid().safeParse(returnedId).success) redirect(`${location}?error=save_failed`);
  revalidatePath("/dashboard");
  revalidatePath(location);
  revalidatePath(`/dashboard/tickets/${returnedId}`);
  redirect(`/dashboard/tickets/${returnedId}?saved=suggestion`);
}
