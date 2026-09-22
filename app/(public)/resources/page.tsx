import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, UsersRound } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { listPublicResources } from "@/lib/db/knowledge-ops";
import { society } from "@/lib/public-content";
export const metadata: Metadata = { title: "Resources", description: "Official Imperial services and published EFDS resources for learning, careers and society life." };
const startingPoints = [
  { title: "Imperial Library", type: "Learning & research", text: "Explore library services, research support and access to academic resources.", href: society.libraryUrl, Icon: BookOpen },
  { title: "Careers Service", type: "Your next direction", text: "Find Imperial’s current career guidance, appointments and opportunities.", href: society.careersUrl, Icon: BriefcaseBusiness },
  { title: "EFDS at the Union", type: "Society life", text: "Find official membership information, committee details and ways to get involved.", href: society.unionUrl, Icon: UsersRound },
];
export default async function ResourcesPage() {
  const resources = await listPublicResources();
  return <main id="main-content"><PageIntro eyebrow="Resources" title="Resources." description="A directory of official Imperial services and the society’s published resources. Start with the library, careers support or the EFDS Union page." />
    <section className="section"><div className="container"><div className="section-heading"><div><span className="editorial-label">The directory</span><h2>Useful at Imperial.</h2></div><p>Official services for learning, careers and society life.</p></div><div className="resource-grid">{startingPoints.map(({title,type,text,href,Icon}) => <article className="resource-card" key={title}><Icon size={25} /><div className="eyebrow">{type}</div><h3>{title}</h3><p>{text}</p><a className="text-link" href={href} target="_blank" rel="noreferrer">Visit {title}<ArrowUpRight size={16} /></a></article>)}</div></div></section>
    <section className="section section-tinted"><div className="container"><div className="section-heading"><div><span className="editorial-label">From the society</span><h2>The EFDS collection.</h2></div><p>Resources selected for public sharing by the society.</p></div>{resources === null ? <div className="editorial-copy"><p role="status">The society collection is temporarily unavailable. The official services above are still available.</p><a className="text-link" href="/resources">Try again <ArrowUpRight size={16} /></a></div> : resources.length ? <div className="resource-grid">{resources.map(resource => <article className="resource-card" key={String(resource.id)}><div className="eyebrow">{String(resource.resource_type ?? "Resource")}</div><h3>{String(resource.name)}</h3><p>{String(resource.description ?? resource.anchor_text ?? "A published EFDS resource.")}</p>{typeof resource.url === "string" && /^https?:\/\//i.test(resource.url) && <a className="text-link" href={resource.url} target="_blank" rel="noreferrer">Open resource <ArrowUpRight size={16} /></a>}<small className="source-note">Source: {String(resource.source_article_title ?? "Reviewed EFDS knowledge")}</small></article>)}</div> : <p className="editorial-copy">No society resources have been published here yet. The official services above are available now.</p>}</div></section>
  </main>;
}
