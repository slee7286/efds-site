import { ArrowUpRight } from "lucide-react";
import { society } from "@/lib/public-content";

export function JoinBanner() {
  return <section className="join-banner"><div className="container join-banner-inner"><div><div className="eyebrow">Your next connection</div><h2>Find your people.<br /><em>Expand your thinking.</em></h2></div><div><p>Start with the society’s official Union page for membership and ways to get involved.</p><a className="button button-paper" href={society.unionUrl} target="_blank" rel="noreferrer">Explore EFDS at the Union <ArrowUpRight size={17} /></a></div></div></section>;
}
