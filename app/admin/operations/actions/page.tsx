import { readPageData } from "@/lib/local-preview";
import { OperationsFilters, OperationsNav, OperationsTable } from "@/components/operations/archive";
import { getOperationalWorkstreams, listOperationalRecords } from "@/lib/db/operations";

export default async function ActionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const [items, workstreams] = await Promise.all([readPageData(() => listOperationalRecords({ type: "action_item", review: params.review, execution: params.execution, query: params.q, workstream: params.workstream, overdue: params.overdue === "true" }), []), readPageData(() => getOperationalWorkstreams(), [])]);
  return <div className="app-content"><div className="eyebrow">Admin · action register</div><h1>Work that has<br />an owner.</h1><p className="app-subtitle">Review state and execution state are separate: an approved action can still be open, blocked or in progress.</p><OperationsNav /><OperationsFilters type="action_item" review={params.review} execution={params.execution} workstream={params.workstream} query={params.q} overdue={params.overdue === "true"} workstreams={workstreams} /><OperationsTable items={items} /></div>;
}
