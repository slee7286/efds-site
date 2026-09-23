import "server-only";

import { requireRole } from "@/lib/auth/server";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SlackRecap = {
  unavailable?: boolean;
  messageCount: number;
  enabledChannels: number;
  lastCompleteSyncAt: string | null;
  stale: boolean;
  messages: { id: string; channel: string; text: string; postedAt: string }[];
};

type Row = Record<string, unknown>;

function excerpt(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/<https?:\/\/[^|>]+\|([^>]+)>/g, "$1").replace(/<([^>|]+)>/g, "$1").replace(/\s+/g, " ").trim().slice(0, 190);
}

export function selectRecapMessages(rows: Row[], channelNames: Map<string, string>) {
  const result: SlackRecap["messages"] = [];
  const perChannel = new Map<string, number>();
  for (const row of rows) {
    const id = String(row.id ?? "");
    const channelId = String(row.channel_id ?? "");
    const text = excerpt(row.message_text);
    const postedAt = typeof row.source_posted_at === "string" ? row.source_posted_at : "";
    if (!id || !channelNames.has(channelId) || !text || !postedAt || text.startsWith("[EFDS archive repost:") || (perChannel.get(channelId) ?? 0) >= 2) continue;
    result.push({ id, channel: channelNames.get(channelId)!, text, postedAt });
    perChannel.set(channelId, (perChannel.get(channelId) ?? 0) + 1);
    if (result.length === 3) break;
  }
  return result;
}

export async function getDailySlackRecap(): Promise<SlackRecap> {
  const empty: SlackRecap = { messageCount: 0, enabledChannels: 0, lastCompleteSyncAt: null, stale: true, messages: [] };
  if (!isSupabaseConfigured) return empty;
  await requireRole("committee");
  try {
    const supabase = await createServerSupabaseClient();
    const [channels, settings] = await Promise.all([
      supabase.from("slack_channels").select("id,name,is_private"),
      supabase.from("slack_channel_sync_settings").select("channel_id,enabled,last_successful_sync_at").eq("enabled", true),
    ]);
    if (channels.error) throw channels.error;
    if (settings.error) throw settings.error;
    const enabled = new Map((settings.data ?? []).map((row: Row) => [String(row.channel_id), row]));
    // The channel query is already RLS-filtered for committee members. Admins
    // can also see enabled private channels in their own recap.
    const visible = (channels.data ?? []).filter((row: Row) => enabled.has(String(row.id)));
    if (!visible.length) return empty;
    const channelNames = new Map(visible.map((row: Row) => [String(row.id), String(row.name)]));
    const syncTimes = visible.map((row: Row) => enabled.get(String(row.id))?.last_successful_sync_at);
    const lastCompleteSyncAt = syncTimes.every((value) => typeof value === "string") ? [...syncTimes].sort((a, b) => Date.parse(String(a)) - Date.parse(String(b)))[0] as string : null;
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const result = await supabase.from("slack_messages")
      .select("id,channel_id,message_text,source_posted_at", { count: "exact" })
      .in("channel_id", [...channelNames.keys()])
      .gte("source_posted_at", cutoff)
      .lte("source_posted_at", now.toISOString())
      .eq("is_deleted", false)
      .order("source_posted_at", { ascending: false })
      .limit(120);
    if (result.error) throw result.error;
    return {
      messageCount: result.count ?? 0,
      enabledChannels: visible.length,
      lastCompleteSyncAt,
      stale: !lastCompleteSyncAt || Date.parse(lastCompleteSyncAt) < now.getTime() - 15 * 60 * 60 * 1000,
      messages: selectRecapMessages(result.data ?? [], channelNames),
    };
  } catch {
    console.error("Daily Slack recap could not be loaded");
    return { ...empty, unavailable: true };
  }
}
