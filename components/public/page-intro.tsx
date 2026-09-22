import type { ReactNode } from "react";

export function PageIntro({ eyebrow, title, description, children }: { eyebrow: string; title: ReactNode; description: string; children?: ReactNode; graphic?: "economics" | "finance" | "data" }) {
  return <section className="chapter-head"><div className="container"><div className="chapter-kicker"><span className="editorial-label">EFDS / {eyebrow}</span><span>Imperial College London</span></div><div className="chapter-title-row"><h1>{title}</h1><div><p>{description}</p>{children && <div className="hero-actions">{children}</div>}</div></div></div></section>;
}
