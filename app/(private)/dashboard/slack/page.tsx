import { SlackArchiveSearchPage, type SlackSearchParams } from "@/components/slack/search-page";

export default function CommitteeSlackArchivePage({ searchParams }: { searchParams?: Promise<SlackSearchParams> }) {
  return <SlackArchiveSearchPage searchParams={searchParams} basePath="/dashboard/slack" />;
}
