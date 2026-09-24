import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { sponsors } from "@/lib/public-content";

export function SponsorRoster() {
  return <div className="sponsor-roster" aria-label="EFDS Society sponsors">
    {(["Founding Partner", "Sponsor"] as const).map((tier) => <section className="sponsor-group" key={tier} aria-label={tier}>
      <h3 className="sponsor-group-heading">{tier}</h3>
      <ul className="sponsor-group-list">
        {sponsors.filter((sponsor) => sponsor.tier === tier).map((sponsor) => <li key={sponsor.name}>
          <a className="sponsor-entry" href={sponsor.href} target="_blank" rel="noopener noreferrer" aria-label={`${sponsor.name}, official website (opens in a new tab)`}>
            <span className="sponsor-logo-wrap"><Image src={sponsor.logo} width={sponsor.logoWidth} height={sponsor.logoHeight} alt="" unoptimized /></span>
            <span className="sponsor-entry-caption"><span>{sponsor.name}</span><ArrowUpRight size={18} strokeWidth={1.5} aria-hidden="true" /></span>
          </a>
        </li>)}
      </ul>
    </section>)}
  </div>;
}
