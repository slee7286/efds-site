import { readPageData } from "@/lib/local-preview";
import { MeetingNav, MeetingSearchForm, MeetingTable } from "@/components/meetings/archive";
import { listMeetings } from "@/lib/db/meetings";

type Params = { q?: string; from?: string; to?: string; transcript?: string; summary?: string };

export default async function AdminAllMeetingsPage({ searchParams }: { searchParams?: Promise<Params> }) {
  const params = searchParams ? await searchParams : {};
  const items = await readPageData(() => listMeetings({ query: params.q, from: params.from, to: params.to, hasTranscript: params.transcript === "true" ? true : undefined, hasSummary: params.summary === "true" ? true : undefined }), []);
  return <div className="app-content"><div className="eyebrow">Admin · meeting archive</div><h1>Browse the meeting shelf.</h1><p className="app-subtitle">Find meeting logs imported from Slack-linked Google Docs and historical recordings.</p><MeetingNav /><MeetingSearchForm query={params.q} from={params.from} to={params.to} hasTranscript={params.transcript === "true"} hasSummary={params.summary === "true"} /><MeetingTable items={items} /><p className="muted" style={{ marginTop: 14, fontSize: 11 }}>Showing {items.length} result(s). Raw meetings are available only to administrators.</p></div>;
}
