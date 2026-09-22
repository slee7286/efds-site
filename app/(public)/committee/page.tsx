import type { Metadata } from "next";
import { PageIntro } from "@/components/public/page-intro";
import { getPublicCommittee } from "@/lib/db/public";
import { society } from "@/lib/public-content";
export const metadata: Metadata = { title: "Committee", description: "Meet the student committee behind Imperial’s EFDS Society." };
export default async function CommitteePage() {
  const committee = await getPublicCommittee();
  return <main id="main-content"><PageIntro eyebrow="Committee" title={<>Your<br />committee.</>} description="The students organising EFDS Society. Names and roles are taken from the official Imperial College Union listing." /><section className="section"><div className="container"><div className="committee-grid">{committee.map((person, index) => <article className="person-card" key={person.name}><div className="person-avatar" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div><div className="person-body"><h2>{person.name}</h2><p>{person.role}</p></div></article>)}</div><p className="source-note">Committee information from <a href={society.unionUrl} target="_blank" rel="noreferrer">Imperial College Union’s EFDS listing</a>, checked 22 September 2026. Visit the Union page for the latest details.</p></div></section></main>;
}
