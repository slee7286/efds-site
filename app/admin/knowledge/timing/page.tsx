import { KnowledgeRegister } from "@/components/knowledge/register";
import { listReviewQueue } from "@/lib/db/knowledge-ops";

export default async function KnowledgeRegisterPage() {
  const { items } = await listReviewQueue({ type: "timing_rule", stale: "current", sort: "priority", pageSize: 100 });
  return <KnowledgeRegister type="timing_rule" eyebrow="Admin · timing operations" title="Keep time honest." intro="Absolute dates, relative notice periods, durations and recurring windows remain distinct. The register never invents an absolute date from a relative rule." items={items} />;
}
