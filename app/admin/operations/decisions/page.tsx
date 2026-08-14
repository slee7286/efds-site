import { OperationsFilters, OperationsNav, OperationsTable } from "@/components/operations/archive";
import { getOperationalWorkstreams, listOperationalRecords } from "@/lib/db/operations";

export default async function DecisionsPage({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const [items, workstreams] = await Promise.all([listOperationalRecords({ type: "decision", review: params.review, query: params.q, workstream: params.workstream }), getOperationalWorkstreams()]);
  return <div className="app-content"><div className="eyebrow">Admin · decision register</div><h1>Decisions, with<br />their history attached.</h1><p className="app-subtitle">Approved decisions are reviewed interpretations. Superseded decisions remain visible for auditability.</p><OperationsNav /><OperationsFilters type="decision" review={params.review} workstream={params.workstream} query={params.q} workstreams={workstreams} /><OperationsTable items={items} /></div>;
}
