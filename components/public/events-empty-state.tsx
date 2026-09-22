import { ArrowUpRight } from "lucide-react";
import { society } from "@/lib/public-content";

export function EventsEmptyState() {
  return <div className="editorial-empty"><span className="editorial-label">Upcoming events</span><div><h3>No dates published yet.</h3><p>There are no confirmed event dates published here yet. Check the official EFDS Union page for current society information and registration options.</p></div><a className="button button-outline" href={society.unionUrl} target="_blank" rel="noreferrer">Visit our Union page <ArrowUpRight size={15} /></a></div>;
}
