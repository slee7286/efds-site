import type { ReactNode } from "react";
import { DisciplineGraphic } from "@/components/public/discipline-graphic";

export function PageIntro({ eyebrow, title, description, children, graphic = "economics" }: { eyebrow: string; title: ReactNode; description: string; children?: ReactNode; graphic?: "economics" | "finance" | "data" }) {
  return <section className="page-hero"><div className="container page-hero-grid"><div><div className="eyebrow"><span className="eyebrow-rule" />{eyebrow}</div><h1>{title}</h1><p className="page-hero-description">{description}</p>{children && <div className="hero-actions">{children}</div>}</div><div className="page-hero-art"><DisciplineGraphic type={graphic} /><span className="art-index">EFDS / STUDIES IN CONNECTION</span></div></div></section>;
}
