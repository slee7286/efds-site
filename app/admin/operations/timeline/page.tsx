import { readPageData, operationsPreview } from "@/lib/local-preview";
import { OperationsNav, ReviewTimeline } from "@/components/operations/archive";
import { getOperationsDashboard } from "@/lib/db/operations";

export default async function OperationsTimelinePage() {
  const dashboard = await readPageData(() => getOperationsDashboard(), operationsPreview);
  return <div className="app-content"><div className="eyebrow">Admin · operational timeline</div><h1>Reviewed activity,<br />not raw chatter.</h1><p className="app-subtitle">This timeline contains operational mutations and review events, not an unfiltered Slack or transcript dump.</p><OperationsNav /><section className="surface"><ReviewTimeline events={dashboard.latestEvents} /></section></div>;
}
