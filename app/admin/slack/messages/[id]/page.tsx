import { SlackArchiveMessagePage } from "@/components/slack/record-pages";

export default async function SlackMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SlackArchiveMessagePage id={id} basePath="/admin/slack" />;
}
