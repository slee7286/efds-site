import { ArrowUpRight } from "lucide-react";
import { society } from "@/lib/public-content";

export function EventsEmptyState() {
  return <div className="empty-event"><div className="calendar-art" aria-hidden="true"><span>UP NEXT</span><strong>↗</strong><small>A new perspective</small></div><div><div className="eyebrow">The society calendar</div><h3>Good conversations are worth finding.</h3><p>There are no confirmed event dates published here yet. Visit the official EFDS Union page for the latest society information and ways to get involved.</p></div><a className="button button-outline" href={society.unionUrl} target="_blank" rel="noreferrer">Visit our Union page <ArrowUpRight size={15} /></a></div>;
}
