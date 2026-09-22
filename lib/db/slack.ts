import "server-only";

import { isSupabaseConfigured } from "@/lib/config";
import { requireRole } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SlackChannel, SlackMessage, SlackMessageChange } from "@/types/domain";

type Row = Record<string, any>;

function text(value: unknown, fallback = ""): string { return typeof value === "string" ? value : fallback; }
function nullable(value: unknown): string | null { return typeof value === "string" && value ? value : null; }
function bool(value: unknown): boolean { return value === true || value === "true"; }

async function requireSlackAdmin() {
  await requireRole("admin");
}

async function count(client: any, table: string) {
  const result = await client.from(table).select("id", { count: "exact", head: true });
  if (result.error) throw result.error;
  return result.count ?? 0;
}

export async function getSlackDashboard() {
  await requireSlackAdmin();
  if (!isSupabaseConfigured) return { workspaces: [], channels: [], counts: { users: 0, messages: 0, threads: 0, files: 0, links: 0, edits: 0 }, latestRun: null, failures: [] };
  const supabase = await createServerSupabaseClient();
  const [workspaceResult, channels, latestRun, users, messages, files, links, edits] = await Promise.all([
    supabase.from("slack_workspaces").select("id, slack_team_id, name, domain, last_synced_at").order("name"),
    listSlackChannels(),
    supabase.from("ingestion_runs").select("id, status, started_at, finished_at, records_seen, records_created, records_updated, records_skipped, records_failed, metadata, error_log").eq("source_type", "slack").order("started_at", { ascending: false }).limit(1),
    count(supabase, "slack_users"), count(supabase, "slack_messages"), count(supabase, "slack_files"), count(supabase, "slack_message_links"), count(supabase, "slack_message_changes"),
  ]);
  if (workspaceResult.error) throw workspaceResult.error;
  if (latestRun.error) throw latestRun.error;
  const allMessages = await fetchMessageRows(supabase, { fields: "id, channel_id, source_posted_at, thread_ts, slack_ts" });
  const threadCount = allMessages.filter((row) => row.thread_ts && row.thread_ts !== row.slack_ts).length;
  return {
    workspaces: workspaceResult.data ?? [],
    channels,
    counts: { users, messages, threads: threadCount, files, links, edits },
    latestRun: latestRun.data?.[0] ?? null,
    failures: Array.isArray(latestRun.data?.[0]?.error_log) ? latestRun.data[0].error_log : [],
  };
}

async function fetchMessageRows(supabase: any, options: { channelId?: string; fields?: string; query?: string; authorId?: string; from?: string; to?: string; edited?: boolean; deleted?: boolean }) {
  let query = supabase.from("slack_messages").select(options.fields ?? "*").order("source_posted_at", { ascending: true });
  if (options.channelId) query = query.eq("channel_id", options.channelId);
  if (options.query) query = query.ilike("message_text", `%${options.query}%`);
  if (options.authorId) query = query.eq("author_user_id", options.authorId);
  if (options.from) query = query.gte("source_posted_at", options.from);
  if (options.to) query = query.lte("source_posted_at", options.to);
  if (options.edited) query = query.not("source_edited_at", "is", null);
  if (options.deleted) query = query.eq("is_deleted", true);
  const result = await query;
  if (result.error) throw result.error;
  return (result.data ?? []) as Row[];
}

async function getUsers(supabase: any) {
  const result = await supabase.from("slack_users").select("id, display_name, real_name, slack_user_id").order("display_name");
  if (result.error) throw result.error;
  return new Map<string, string>((result.data ?? []).map((row: Row) => [String(row.id), text(row.display_name || row.real_name, text(row.slack_user_id))]));
}

export async function listSlackChannels(query?: string): Promise<SlackChannel[]> {
  await requireSlackAdmin();
  if (!isSupabaseConfigured) return [];
  const supabase = await createServerSupabaseClient();
  const [channelResult, settingsResult, messageRows] = await Promise.all([
    supabase.from("slack_channels").select("id, workspace_id, name, topic, purpose, is_private, archived, last_synced_at").order("name"),
    supabase.from("slack_channel_sync_settings").select("channel_id, enabled"),
    fetchMessageRows(supabase, { fields: "channel_id, source_posted_at" }),
  ]);
  if (channelResult.error) throw channelResult.error;
  if (settingsResult.error) throw settingsResult.error;
  const settings = new Map((settingsResult.data ?? []).map((row: Row) => [String(row.channel_id), bool(row.enabled)]));
  const stats = new Map<string, { count: number; latest: string | null }>();
  for (const row of messageRows) {
    const id = text(row.channel_id); const current = stats.get(id) ?? { count: 0, latest: null };
    current.count += 1;
    const posted = nullable(row.source_posted_at);
    if (posted && (!current.latest || posted > current.latest)) current.latest = posted;
    stats.set(id, current);
  }
  const normalized = query?.trim().toLowerCase();
  return (channelResult.data ?? []).map((row: Row) => ({
    id: text(row.id), workspaceId: nullable(row.workspace_id), name: text(row.name), topic: nullable(row.topic), purpose: nullable(row.purpose), isPrivate: bool(row.is_private), archived: bool(row.archived), syncEnabled: settings.get(text(row.id)) ?? false, lastSyncedAt: nullable(row.last_synced_at), messageCount: stats.get(text(row.id))?.count ?? 0, latestMessageAt: stats.get(text(row.id))?.latest ?? null,
  })).filter((channel) => !normalized || [channel.name, channel.topic, channel.purpose].filter(Boolean).join(" ").toLowerCase().includes(normalized));
}

async function normalizeMessages(supabase: any, rows: Row[], channelNames: Map<string, string>) {
  const users = await getUsers(supabase);
  const ids = rows.map((row) => String(row.id));
  const [reactionsResult, linksResult, filesResult] = await Promise.all([
    ids.length ? supabase.from("slack_reactions").select("message_id, name, slack_user_id").in("message_id", ids) : { data: [], error: null },
    ids.length ? supabase.from("slack_message_links").select("message_id, url, domain").in("message_id", ids) : { data: [], error: null },
    ids.length ? supabase.from("slack_files").select("slack_file_id, message_id, filename, title, mime_type, size_bytes, permalink").in("message_id", ids) : { data: [], error: null },
  ]);
  if (reactionsResult.error) throw reactionsResult.error;
  if (linksResult.error) throw linksResult.error;
  if (filesResult.error) throw filesResult.error;
  const reactions = new Map<string, { name: string; slackUserId: string }[]>();
  for (const row of reactionsResult.data ?? []) reactions.set(String(row.message_id), [...(reactions.get(String(row.message_id)) ?? []), { name: text(row.name), slackUserId: text(row.slack_user_id) }]);
  const links = new Map<string, { url: string; domain: string | null }[]>();
  for (const row of linksResult.data ?? []) links.set(String(row.message_id), [...(links.get(String(row.message_id)) ?? []), { url: text(row.url), domain: nullable(row.domain) }]);
  const files = new Map<string, { id: string; filename: string | null; title: string | null; mimeType: string | null; sizeBytes: number | null; permalink: string | null }[]>();
  for (const row of filesResult.data ?? []) files.set(String(row.message_id), [...(files.get(String(row.message_id)) ?? []), { id: text(row.slack_file_id), filename: nullable(row.filename), title: nullable(row.title), mimeType: nullable(row.mime_type), sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : null, permalink: nullable(row.permalink) }]);
  return rows.map((row) => ({ id: text(row.id), channelId: text(row.channel_id), channelName: channelNames.get(text(row.channel_id)) ?? "Unknown channel", slackTs: text(row.slack_ts), threadTs: nullable(row.thread_ts), parentMessageId: nullable(row.parent_message_id), authorUserId: nullable(row.author_user_id), authorName: users.get(String(row.author_user_id)) ?? text(row.user_slack_id, "Unknown user"), text: nullable(row.message_text), subtype: nullable(row.subtype), sourcePostedAt: nullable(row.source_posted_at), sourceEditedAt: nullable(row.source_edited_at), permalink: nullable(row.permalink), contentHash: nullable(row.content_hash), isDeleted: bool(row.is_deleted), firstSeenAt: nullable(row.first_seen_at), lastSeenAt: nullable(row.last_seen_at), lastChangedAt: nullable(row.last_changed_at), reactions: reactions.get(text(row.id)) ?? [], links: links.get(text(row.id)) ?? [], files: files.get(text(row.id)) ?? [] }));
}

export async function listSlackMessages(options: { query?: string; channelId?: string; authorId?: string; from?: string; to?: string; edited?: boolean; deleted?: boolean; page?: number } = {}) {
  await requireSlackAdmin();
  const pageSize = 30;
  const page = Math.min(Math.max(Math.trunc(options.page || 1), 1), 10000);
  if (!isSupabaseConfigured) return { items: [] as SlackMessage[], total: 0, page, pageSize };
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("slack_messages").select("*", { count: "exact" }).order("source_posted_at", { ascending: false });
  if (options.channelId) query = query.eq("channel_id", options.channelId);
  if (options.query?.trim()) query = query.ilike("message_text", `%${options.query.trim().slice(0, 160)}%`);
  if (options.authorId) query = query.eq("author_user_id", options.authorId);
  if (options.from) query = query.gte("source_posted_at", options.from);
  if (options.to) query = query.lte("source_posted_at", options.to);
  if (options.edited) query = query.not("source_edited_at", "is", null);
  if (options.deleted) query = query.eq("is_deleted", true);
  const [channels, result] = await Promise.all([
    supabase.from("slack_channels").select("id, name"),
    query.range((page - 1) * pageSize, page * pageSize - 1),
  ]);
  if (channels.error) throw channels.error;
  if (result.error) throw result.error;
  const items = await normalizeMessages(supabase, (result.data ?? []) as Row[], new Map((channels.data ?? []).map((row: Row) => [text(row.id), text(row.name)])));
  return { items, total: result.count ?? 0, page, pageSize };
}

export async function getSlackChannel(id: string) {
  await requireSlackAdmin();
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const [channelResult, settingResult, rows] = await Promise.all([
    supabase.from("slack_channels").select("id, workspace_id, name, topic, purpose, is_private, archived, last_synced_at").eq("id", id).maybeSingle(),
    supabase.from("slack_channel_sync_settings").select("enabled, include_threads, include_file_metadata, last_successful_sync_at, newest_message_ts").eq("channel_id", id).maybeSingle(),
    fetchMessageRows(supabase, { channelId: id }),
  ]);
  if (channelResult.error) throw channelResult.error;
  if (settingResult.error) throw settingResult.error;
  if (!channelResult.data) return null;
  const messages = await normalizeMessages(supabase, rows, new Map([[id, text(channelResult.data.name)]]));
  return { channel: channelResult.data, setting: settingResult.data, messages };
}

export async function getSlackMessage(id: string) {
  await requireSlackAdmin();
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("slack_messages").select("*").eq("id", id).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;
  const [channel, changes] = await Promise.all([
    supabase.from("slack_channels").select("id, name").eq("id", result.data.channel_id).maybeSingle(),
    supabase.from("slack_message_changes").select("id, change_type, previous_content_hash, new_content_hash, previous_text, new_text, source_edited_at, detected_at").eq("message_id", id).order("detected_at", { ascending: false }),
  ]);
  if (channel.error) throw channel.error;
  if (changes.error) throw changes.error;
  const [message] = await normalizeMessages(supabase, [result.data], new Map([[String(channel.data?.id), text(channel.data?.name, "Unknown channel")]]));
  return { message, changes: (changes.data ?? []).map((row: Row) => ({ id: text(row.id), changeType: text(row.change_type), previousContentHash: nullable(row.previous_content_hash), newContentHash: nullable(row.new_content_hash), previousText: nullable(row.previous_text), newText: nullable(row.new_text), sourceEditedAt: nullable(row.source_edited_at), detectedAt: text(row.detected_at) })) as SlackMessageChange[] };
}

export async function listSlackAuthors() {
  await requireSlackAdmin();
  if (!isSupabaseConfigured) return [] as { id: string; label: string }[];
  const supabase = await createServerSupabaseClient();
  const result = await supabase.from("slack_users").select("id, slack_user_id, display_name, real_name").order("display_name");
  if (result.error) throw result.error;
  return (result.data ?? []).map((row: Row) => ({ id: text(row.id), label: text(row.display_name || row.real_name, row.slack_user_id) }));
}
