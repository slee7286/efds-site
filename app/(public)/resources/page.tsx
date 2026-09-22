import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, UsersRound } from "lucide-react";
import { PageIntro } from "@/components/public/page-intro";
import { listPublicResources } from "@/lib/db/knowledge-ops";
import { society } from "@/lib/public-content";
export const metadata: Metadata = { title: "Resources", description: "A considered starting point for learning, careers and society life at Imperial." };
const startingPoints = [
  { title: "Imperial Library", type: "Learning & research", text: "Explore library services, research support and access to academic resources.", href: society.libraryUrl, Icon: BookOpen },
  { title: "Careers Service", type: "Your next direction", text: "Find Imperial’s current career guidance, appointments and opportunities.", href: society.careersUrl, Icon: BriefcaseBusiness },
  { title: "EFDS at the Union", type: "Society life", text: "Find official membership information, committee details and ways to get involved.", href: society.unionUrl, Icon: UsersRound },
];
export default async function ResourcesPage() {
  const resources = await listPublicResources();
  return <main id="main-content"><PageIntro eyebrow="Resources & learning" title={<>A useful place<br /><em>to begin.</em></>} description="Good resources help you ask better questions. Start with trusted Imperial services, then explore the society’s published collection." graphic="data" />
    <section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow">The essentials</div><h2>Keep these <em>close.</em></h2></div><p>Three official starting points for your time at Imperial.</p></div><div className="resource-grid">{startingPoints.map(({title,type,text,href,Icon}) => <article className="resource-card" key={title}><Icon size={25} /><div className="eyebrow">{type}</div><h3>{title}</h3><p>{text}</p><a className="text-link" href={href} target="_blank" rel="noreferrer">Visit {title}<ArrowUpRight size={16} /></a></article>)}</div></div></section>
    <section className="section section-tinted"><div className="container"><div className="section-heading"><div><div className="eyebrow">From the society</div><h2>The EFDS collection.</h2></div><p>Resources selected for public sharing by the society.</p></div>{resources.length ? <div className="resource-grid">{resources.map(resource => <article className="resource-card" key={String(resource.id)}><div className="eyebrow">{String(resource.resource_type ?? "Resource")}</div><h3>{String(resource.name)}</h3><p>{String(resource.description ?? resource.anchor_text ?? "A published EFDS resource.")}</p>{typeof resource.url === "string" && /^https?:\/\//i.test(resource.url) && <a className="text-link" href={resource.url} target="_blank" rel="noreferrer">Open resource <ArrowUpRight size={16} /></a>}<small className="source-note">Source: {String(resource.source_article_title ?? "Reviewed EFDS knowledge")}</small></article>)}</div> : <div className="surface empty-state"><BookOpen size={27} /><h2>A considered collection takes shape.</h2><p>No society resources have been published here yet. The official services above are a useful place to start.</p></div>}</div></section>
  </main>;
}
