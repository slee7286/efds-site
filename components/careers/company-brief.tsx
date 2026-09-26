import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { type CompanyGuide, guideTopics } from "@/lib/careers/company-guide";

export function CompanyBrief({ company, backHref }: { company: CompanyGuide; backHref: string }) {
  return <div className="career-guide career-guide-detail">
    <Link className="career-guide-back" href={backHref}><ArrowLeft size={15} /> All company research</Link>
    <div className="eyebrow">Reviewed company brief · {company.reviewedAt}</div><h1>{company.name}</h1><p className="app-subtitle">{company.findings.length} sourced findings across the business, its work and the recruiting evidence.</p>
    <div className="career-guide-note"><strong>Read with the right scope</strong><p>Each finding has its own source and scope. A group-level statement may not describe a particular office or role. Openings and deadlines may have changed since this {company.reviewedAt} snapshot; check the employer’s current careers site.</p></div>
    <nav className="career-guide-toc" aria-label="Company brief sections">{guideTopics.filter(([topic]) => company.findings.some((finding) => finding.topic === topic)).map(([topic, label]) => <a key={topic} href={`#${topic}`}>{label}</a>)}</nav>
    {guideTopics.map(([topic, label]) => {
      const findings = company.findings.filter((finding) => finding.topic === topic);
      if (!findings.length) return null;
      return <section className="career-guide-topic" id={topic} key={topic}><div className="career-guide-topic-heading"><span>{String(guideTopics.findIndex(([item]) => item === topic) + 1).padStart(2, "0")}</span><h2>{label}</h2><small>{findings.length} {findings.length === 1 ? "finding" : "findings"}</small></div><div className="career-guide-findings">{findings.map((finding) => <article className="career-guide-finding" key={finding.id}><p>{finding.statement}</p><div className="career-guide-scope">Scope: {finding.scope}{finding.eventDate ? ` · Event date: ${finding.eventDate}` : ""}</div><div className="career-guide-citations">{finding.citations.map((citation, index) => <a key={`${finding.id}-${index}`} href={citation.url} target="_blank" rel="noopener noreferrer">{citation.publisher}: {citation.title} <ArrowUpRight size={12} aria-hidden="true" /><span className="sr-only"> (opens in new tab)</span></a>)}</div></article>)}</div></section>;
    })}
    {!!company.roles.length && <section className="career-guide-extra"><h2>Role briefs in the research</h2><p>These refer to the source snapshot and do not establish that an application is still open.</p><ul>{company.roles.map((role, index) => <li key={`${role.title}-${index}`}><strong>{role.title}</strong><span>{role.office}</span></li>)}</ul></section>}
    {!!company.gaps.length && <section className="career-guide-extra"><h2>Evidence gaps</h2><ul>{company.gaps.map((gap, index) => <li key={index}><strong>{gap.topic}</strong><span>{gap.description}</span></li>)}</ul></section>}
    {!!company.openQuestions.length && <section className="career-guide-extra"><h2>Questions to verify</h2><ul>{company.openQuestions.map((question, index) => <li key={index}>{question}</li>)}</ul></section>}
  </div>;
}
