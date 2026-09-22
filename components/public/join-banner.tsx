import { ArrowUpRight } from "lucide-react";
import { society } from "@/lib/public-content";

export function JoinBanner() {
  return <section className="membership-strip"><div className="container"><div><span className="editorial-label">Economics, Finance &amp; Data Science Society</span><h2>See you around campus.</h2></div><a href={society.unionUrl} target="_blank" rel="noreferrer">Find EFDS at the Union <ArrowUpRight size={24} /></a></div></section>;
}
