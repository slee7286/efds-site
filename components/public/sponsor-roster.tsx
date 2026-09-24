import { ArrowUpRight } from "lucide-react";
import { sponsors } from "@/lib/public-content";

export function SponsorRoster() {
  return <ol className="sponsor-roster" aria-label="EFDS Society sponsors">
    {sponsors.map((sponsor, index) => <li key={sponsor.name}>
      <a className="sponsor-entry" href={sponsor.href} target="_blank" rel="noopener noreferrer" aria-label={`${sponsor.name}, ${sponsor.tier}, official website (opens in a new tab)`}>
        <span className="sponsor-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span className="sponsor-name">{sponsor.name}</span>
        <span className="sponsor-tier">{sponsor.tier}</span>
        <ArrowUpRight size={21} strokeWidth={1.5} aria-hidden="true" />
      </a>
    </li>)}
  </ol>;
}
