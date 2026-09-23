import { SlackArchiveSearchPage, type SlackSearchParams } from "@/components/slack/search-page";

export default function SlackChannelsPage({ searchParams }: { searchParams?: Promise<SlackSearchParams> }) {
  return <SlackArchiveSearchPage searchParams={searchParams} basePath="/admin/slack" />;
}
