import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getSlackChannel } from "@/lib/db/slack";
import { SlackNav, ThreadedSlackMessages } from "@/components/slack/archive";

export default async function SlackChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSlackChannel(id);
  if (!result) return <div className="app-content"><Link className="button button-quiet" href="/admin/slack/channels"><ArrowLeft size={14} /> Back to channels</Link><h1>Channel not found</h1></div>;
  return <div className="app-content"><Link className="button button-quiet" href="/admin/slack/channels"><ArrowLeft size={14} /> Back to channels</Link><div style={{ marginTop: 22 }}><SlackNav /><div className="eyebrow">{result.channel.is_private ? "Private" : "Public"} channel</div><h1>#{result.channel.name}</h1><p className="app-subtitle">{result.channel.topic || result.channel.purpose || "No Slack topic or purpose recorded."}</p><div className="tag-list"><span className={result.setting?.enabled ? "badge badge-mint" : "badge badge-neutral"}>{result.setting?.enabled ? "archived" : "not enabled"}</span><span className="tag">{result.messages.length} messages loaded</span><span className="tag">Threads are structurally preserved</span></div><section style={{ marginTop: 20 }}><ThreadedSlackMessages messages={result.messages} /></section></div></div>;
}
