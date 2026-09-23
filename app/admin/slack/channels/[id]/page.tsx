import { SlackArchiveChannelPage } from "@/components/slack/record-pages";

export default async function SlackChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SlackArchiveChannelPage id={id} basePath="/admin/slack" />;
}
