import type { Metadata } from "next";
import { PageIntro } from "@/components/public/page-intro";
import { getPublicCommittee } from "@/lib/db/public";
import { society } from "@/lib/public-content";
export const metadata: Metadata = { title: "Committee", description: "Meet the student committee behind Imperial’s EFDS Society." };
export default async function CommitteePage() {
  const committee = await getPublicCommittee();
  return <main id="main-content"><PageIntro eyebrow="Your committee" title={<>A society made<br /><em>by its people.</em></>} description="Meet the students behind EFDS. The committee helps the society stay connected, organised and open to new ideas." graphic="data" /><section className="section"><div className="container"><div className="committee-grid">{committee.map(person => <article className="person-card" key={person.name}><div className="person-avatar" aria-hidden="true">{person.name.split(" ").map(p => p[0]).slice(0,2).join("")}</div><div className="person-body"><h2>{person.name}</h2><p>{person.role}</p></div></article>)}</div><p className="source-note">Committee information from <a href={society.unionUrl} target="_blank" rel="noreferrer">Imperial College Union’s EFDS listing</a>, checked 22 September 2026. Visit the Union page for the latest details.</p></div></section></main>;
}
