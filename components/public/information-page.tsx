import type { ReactNode } from "react";

type InformationPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export function InformationPage({ eyebrow, title, intro, children }: InformationPageProps) {
  return (
    <main>
      <section className="container page-intro">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="display">{title}</h1>
        <p>{intro}</p>
      </section>
      <section className="section-tight"><div className="container info-page-content">{children}</div></section>
    </main>
  );
}

export function InformationCard({ eyebrow, title, children, dark = false }: { eyebrow?: string; title: string; children: ReactNode; dark?: boolean }) {
  return <article className={`${dark ? "surface-dark" : "surface"} info-card`}>
    {eyebrow && <div className="eyebrow" style={dark ? { color: "var(--mint)" } : undefined}>{eyebrow}</div>}
    <div className="article-body"><h2>{title}</h2>{children}</div>
  </article>;
}
