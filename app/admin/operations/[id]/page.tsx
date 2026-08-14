import Link from "next/link";
import { notFound } from "next/navigation";
import { EditOperationalRecordForm, EvidenceList, EvidencePicker, OperationsNav, RecordActions, ReviewTimeline } from "@/components/operations/archive";
import { getOperationalRecord } from "@/lib/db/operations";
import { searchRetrieval } from "@/lib/db/retrieval";

export default async function OperationalRecordPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ evidenceQuery?: string }> }) {
  const { id } = await params;
  const result = await getOperationalRecord(id);
  if (!result) notFound();
  const query = searchParams ? (await searchParams).evidenceQuery?.trim() : undefined;
  const evidenceResults = query ? await searchRetrieval({ query, scope: "admin", limit: 10 }) : [];
  const { record } = result;
  return <div className="app-content"><div className="eyebrow">Admin · operational record</div><h1>{record.title}</h1><p className="app-subtitle">A reviewed interpretation supported by immutable source evidence.</p><OperationsNav /><section className="surface info-card"><div className="panel-heading"><h2>{record.recordType.replaceAll("_", " ")}</h2><span className="badge badge-neutral">{record.reviewStatus.replaceAll("_", " ")}</span></div><dl className="security-details"><div><dt>Execution</dt><dd>{record.executionStatus || "Not applicable"}</dd></div><div><dt>Visibility</dt><dd>{record.visibility}</dd></div><div><dt>Workstream</dt><dd>{record.workstream || "Unclassified"}</dd></div><div><dt>Owner</dt><dd>{record.ownerText || record.ownerProfileId || record.ownerOfficerId || "Unassigned"}</dd></div><div><dt>Due</dt><dd>{record.dueText || record.dueAt || "Not specified"}</dd></div><div><dt>Occurred</dt><dd>{record.occurredAt || "Not specified"}</dd></div><div><dt>Review version</dt><dd>{record.reviewVersion}</dd></div></dl>{record.description && <div className="ops-quote" style={{ marginTop: 18 }}>{record.description}</div>}<RecordActions record={record} /></section><EditOperationalRecordForm record={record} /><EvidenceList record={record} evidence={result.evidence} /><EvidencePicker record={record} results={evidenceResults} /><section className="surface info-card" style={{ marginTop: 18 }}><div className="panel-heading"><h2>Review history</h2><span className="muted">Audit events are written transactionally.</span></div><ReviewTimeline events={result.events} /></section><p className="muted" style={{ marginTop: 18 }}><Link href="/admin/search">Search more source evidence</Link></p></div>;
}
