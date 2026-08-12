import { KnowledgeRegister } from "@/components/knowledge/register";
import { listReviewQueue } from "@/lib/db/knowledge-ops";

export default async function KnowledgeRegisterPage() {
  const { items } = await listReviewQueue({ type: "contact", stale: "current", sort: "priority", pageSize: 100 });
  return <KnowledgeRegister type="contact" eyebrow="Admin · contacts" title="Keep the right<br />route visible." intro="Review extracted operational contacts without losing their article evidence." items={items} />;
}
