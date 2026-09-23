import { SlackArchiveMessagePage } from "@/components/slack/record-pages";

export default async function CommitteeSlackMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SlackArchiveMessagePage id={id} basePath="/dashboard/slack" />;
}
