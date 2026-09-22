import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className={`brand${compact ? " brand-compact" : ""}`} href="/" aria-label="EFDS Society home"><span className="brand-wordmark">EFDS<span className="brand-period">.</span></span><span className="brand-caption">Imperial College London<br /><span>Economics, Finance &amp; Data Science Society</span></span></Link>;
}
