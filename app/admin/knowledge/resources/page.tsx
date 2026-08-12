import { KnowledgeRegister } from "@/components/knowledge/register";
import { listReviewQueue } from "@/lib/db/knowledge-ops";

export default async function KnowledgeRegisterPage() {
  const { items } = await listReviewQueue({ type: "resource", stale: "current", sort: "priority", pageSize: 100 });
  return <KnowledgeRegister type="resource" eyebrow="Admin · resource library" title="Keep the useful<br />links current." intro="Review forms, systems, webpages, templates and policies with safe source links and explicit visibility." items={items} />;
}
