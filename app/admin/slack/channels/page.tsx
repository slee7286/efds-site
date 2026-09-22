import { readPageData } from "@/lib/local-preview";
import { SlackChannelTable, SlackNav, SlackSearchForm } from "@/components/slack/archive";
import { listSlackAuthors, listSlackChannels, listSlackMessages } from "@/lib/db/slack";

type SearchParams = { q?: string; channel?: string; author?: string; from?: string; to?: string; edited?: string; deleted?: string };

export default async function SlackChannelsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const query = searchParams ? await searchParams : {};
  const [channels, authors] = await Promise.all([readPageData(() => listSlackChannels(), []), readPageData(() => listSlackAuthors(), [])]);
  const hasSearch = Boolean(query.q || query.channel || query.author || query.from || query.to || query.edited || query.deleted);
  const messages = hasSearch ? await readPageData(() => listSlackMessages({ query: query.q, channelId: query.channel, authorId: query.author, from: query.from ? `${query.from}T00:00:00.000Z` : undefined, to: query.to ? `${query.to}T23:59:59.999Z` : undefined, edited: query.edited === "true", deleted: query.deleted === "true" }), []) : [];
  const visibleChannels = query.q ? channels.filter((channel) => [channel.name, channel.topic, channel.purpose].filter(Boolean).join(" ").toLowerCase().includes(query.q!.trim().toLowerCase())) : channels;
  return <div className="app-content"><div className="eyebrow">Admin · Slack channels</div><h1>Browse the archive.</h1><p className="app-subtitle">Only channels explicitly enabled by the backend allowlist contain archived content.</p><SlackNav /><SlackSearchForm query={query.q} channel={query.channel} author={query.author} from={query.from} to={query.to} edited={query.edited === "true"} deleted={query.deleted === "true"} channels={channels} authors={authors} />{hasSearch && <section style={{ marginBottom: 24 }}><div className="eyebrow">Message matches · {messages.length}</div><div>{messages.slice(0, 50).map((message) => <div key={message.id}><SlackMessageResult message={message} /></div>)}</div></section>}<SlackChannelTable channels={visibleChannels} /></div>;
}

function SlackMessageResult({ message }: { message: import("@/types/domain").SlackMessage }) { return <a className="queue-row" href={`/admin/slack/messages/${message.id}`}><div><strong>{message.channelName} · {message.authorName}</strong><p>{message.text || "[No text]"}</p></div><small>{message.sourcePostedAt ? new Date(message.sourcePostedAt).toLocaleDateString("en-GB") : ""}</small></a>; }
