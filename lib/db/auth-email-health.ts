import "server-only";

import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AuthEmailHealth = {
  accepted24h: number;
  resend24h: number;
  brevo24h: number;
  failed24h: number;
  quotaSignals24h: number;
  delivered7d: number;
  bounced7d: number;
  awaitingEvent7d: number;
  lastAttemptAt: string | null;
  lastDeliveryEventAt: string | null;
};

const empty: AuthEmailHealth = {
  accepted24h: 0, resend24h: 0, brevo24h: 0, failed24h: 0,
  quotaSignals24h: 0, delivered7d: 0, bounced7d: 0,
  awaitingEvent7d: 0, lastAttemptAt: null, lastDeliveryEventAt: null,
};

export async function getAuthEmailHealth(): Promise<AuthEmailHealth> {
  if (!isSupabaseConfigured) return empty;
  await requireRole("admin");
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("auth_email_health");
  if (error) throw error;
  const row = data as Partial<AuthEmailHealth> | null;
  if (!row || typeof row !== "object") return empty;
  return {
    ...empty,
    accepted24h: Number(row.accepted24h ?? 0),
    resend24h: Number(row.resend24h ?? 0),
    brevo24h: Number(row.brevo24h ?? 0),
    failed24h: Number(row.failed24h ?? 0),
    quotaSignals24h: Number(row.quotaSignals24h ?? 0),
    delivered7d: Number(row.delivered7d ?? 0),
    bounced7d: Number(row.bounced7d ?? 0),
    awaitingEvent7d: Number(row.awaitingEvent7d ?? 0),
    lastAttemptAt: row.lastAttemptAt ?? null,
    lastDeliveryEventAt: row.lastDeliveryEventAt ?? null,
  };
}
