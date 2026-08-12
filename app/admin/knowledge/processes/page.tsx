import { KnowledgeRegister } from "@/components/knowledge/register";
import { listReviewQueue } from "@/lib/db/knowledge-ops";

export default async function KnowledgeRegisterPage() {
  const { items } = await listReviewQueue({ type: "process", stale: "current", sort: "priority", pageSize: 100 });
  return <KnowledgeRegister type="process" eyebrow="Admin · process library" title="Turn guidance into<br />repeatable work." intro="Review reusable process descriptions and their source-linked steps before publication." items={items} />;
}
