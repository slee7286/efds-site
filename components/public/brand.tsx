import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link className={`brand${compact ? " brand-compact" : ""}`} href="/" aria-label="EFDS Society home"><span className="brand-symbol" aria-hidden="true"><i /><i /><i /></span><span className="brand-wordmark">EFDS<span className="brand-caption">IMPERIAL COLLEGE LONDON</span></span></Link>;
}
