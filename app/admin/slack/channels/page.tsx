import Link from "next/link";
import { readPageData } from "@/lib/local-preview";
import { SlackChannelTable, SlackNav, SlackSearchForm } from "@/components/slack/archive";
import { listSlackAuthors, listSlackChannels, listSlackMessages } from "@/lib/db/slack";
import type { SlackMessage } from "@/types/domain";

type SearchParams = { q?: string; channel?: string; author?: string; from?: string; to?: string; edited?: string; deleted?: string; page?: string };

export default async function SlackChannelsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const query = searchParams ? await searchParams : {};
  const page = Math.min(Math.max(Number.parseInt(query.page || "1", 10) || 1, 1), 10000);
  const [channels, authors] = await Promise.all([
    readPageData(() => listSlackChannels(), []),
    readPageData(() => listSlackAuthors(), []),
  ]);
  const results = await readPageData(() => listSlackMessages({
    query: query.q, channelId: query.channel, authorId: query.author,
    from: query.from ? `${query.from}T00:00:00.000Z` : undefined,
    to: query.to ? `${query.to}T23:59:59.999Z` : undefined,
    edited: query.edited === "true", deleted: query.deleted === "true", page,
  }), { items: [], total: 0, page, pageSize: 30 });
  const linkToPage = (number: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (key !== "page" && typeof value === "string" && value) params.set(key, value);
    params.set("page", String(number));
    return `/admin/slack/channels?${params.toString()}`;
  };
  return <div className="app-content">
    <div className="eyebrow">Admin · Slack archive</div>
    <h1>Search the record.</h1>
    <p className="app-subtitle">Find saved messages from enabled channels, even after they leave Slack’s visible history. Results are newest first.</p>
    <SlackNav />
    <SlackSearchForm query={query.q} channel={query.channel} author={query.author} from={query.from} to={query.to} edited={query.edited === "true"} deleted={query.deleted === "true"} channels={channels} authors={authors} />
    <section aria-label="Archived Slack message results" style={{ marginBottom: 28 }}>
      <div className="panel-heading"><h2>Messages</h2><span className="muted">{results.total} match{results.total === 1 ? "" : "es"}</span></div>
      {results.items.map((message) => <SlackMessageResult key={message.id} message={message} />)}
      {!results.items.length && <div className="empty-state"><h3>No archived messages found.</h3><p>Try a different phrase, channel or date range.</p></div>}
      {results.total > results.pageSize && <nav className="tag-list" aria-label="Message result pages" style={{ marginTop: 18 }}>
        {results.page > 1 && <Link className="tag" href={linkToPage(results.page - 1)}>Previous</Link>}
        <span className="tag">Page {results.page} of {Math.ceil(results.total / results.pageSize)}</span>
        {results.page * results.pageSize < results.total && <Link className="tag" href={linkToPage(results.page + 1)}>Next</Link>}
      </nav>}
    </section>
    <div className="panel-heading"><h2>Channels</h2></div>
    <SlackChannelTable channels={channels} />
  </div>;
}

function SlackMessageResult({ message }: { message: SlackMessage }) {
  const isTicket = /^ACTION-\d{3}\b/.test(message.text || "");
  const completed = message.reactions.some((reaction) => reaction.name === "white_check_mark");
  const open = message.reactions.some((reaction) => reaction.name === "x");
  return <Link className="queue-row" href={`/admin/slack/messages/${message.id}`}>
    <div><strong>#{message.channelName} · {message.authorName}</strong><p>{(message.text || "[No text]").slice(0, 360)}{(message.text?.length || 0) > 360 ? "…" : ""}</p></div>
    <small>{isTicket && <span className={completed ? "badge badge-mint" : open ? "badge badge-coral" : "badge badge-neutral"}>{completed ? "Complete" : open ? "Open" : "Unmarked"}</span>}{message.sourcePostedAt ? new Date(message.sourcePostedAt).toLocaleDateString("en-GB") : ""}</small>
  </Link>;
}
