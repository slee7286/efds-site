import { readPageData } from "@/lib/local-preview";
import { OperationsFilters, OperationsNav, OperationsTable } from "@/components/operations/archive";
import { getOperationalWorkstreams, listOperationalRecords } from "@/lib/db/operations";

export default async function QuestionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const [items, workstreams] = await Promise.all([readPageData(() => listOperationalRecords({ type: "open_question", review: params.review, execution: params.execution, query: params.q, workstream: params.workstream }), []), readPageData(() => getOperationalWorkstreams(), [])]);
  return <div className="app-content"><div className="eyebrow">Admin · open questions</div><h1>Keep uncertainty<br />visible.</h1><p className="app-subtitle">Open questions can be answered or resolved with a decision and supporting evidence. They are never silently deleted.</p><OperationsNav /><OperationsFilters type="open_question" review={params.review} execution={params.execution} workstream={params.workstream} query={params.q} workstreams={workstreams} /><OperationsTable items={items} /></div>;
}
