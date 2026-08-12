import { KnowledgeAdminNav, ReviewTable } from "@/components/knowledge/operations";
import { listReviewQueue } from "@/lib/db/knowledge-ops";

export default async function StaleKnowledgePage() {
  const { items, total } = await listReviewQueue({ stale: "stale", sort: "stale", pageSize: 100 });
  return <div className="app-content"><div className="eyebrow">Admin · source changes</div><h1>Reconcile the<br />changed source.</h1><p className="app-subtitle">Approved interpretations are never silently overwritten. When an ICU hash changes, the prior record remains visible here until a reviewer keeps, replaces, rejects or supersedes it.</p><KnowledgeAdminNav /><section className="surface info-card" style={{ marginBottom: 18 }}><div className="panel-heading"><h2>{total} stale record(s)</h2><span className="badge badge-coral">Needs attention</span></div><p>Use the review detail page to compare the retained interpretation and its exact evidence with the new extraction candidate. Approving a retained stale record explicitly marks that source version as still valid.</p></section><ReviewTable items={items} /></div>;
}
