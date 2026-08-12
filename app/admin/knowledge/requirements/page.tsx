import { KnowledgeRegister } from "@/components/knowledge/register";
import { listReviewQueue } from "@/lib/db/knowledge-ops";

export default async function KnowledgeRegisterPage() {
  const { items } = await listReviewQueue({ type: "requirement", stale: "current", sort: "priority", pageSize: 100 });
  return <KnowledgeRegister type="requirement" eyebrow="Admin · requirements register" title="Make every obligation traceable." intro="Review mandatory guidance, applicability, evidence, roles and source versions before it becomes trusted operational knowledge." items={items} />;
}
