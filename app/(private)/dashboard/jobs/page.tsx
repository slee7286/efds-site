import { BriefcaseBusiness, ArrowUpRight } from "lucide-react";
import { society } from "@/lib/public-content";

export default function JobsPage() {
  return <div className="app-content"><div className="eyebrow">Career workspace</div><h1>Your next opportunity.</h1><p className="app-subtitle">A place for the applications and possibilities ahead.</p><section className="surface empty-state"><BriefcaseBusiness size={28} /><h2>Application tracking is being prepared.</h2><p>Saving and managing applications is not available here yet. Explore Imperial’s careers support for current opportunities, guidance and appointments.</p><a className="button button-primary" style={{ marginTop: 24 }} href={society.careersUrl} target="_blank" rel="noreferrer">Explore Imperial careers <ArrowUpRight size={16} /></a></section></div>;
}
