import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type CompanyGuide, guideTopics } from "@/lib/careers/company-guide";

type Finding = CompanyGuide["findings"][number];

// Keep full statements and their provenance intact, but avoid both individual
// cards and a single unbroken wall of text for a heavily researched topic.
function paragraphs(findings: Finding[]) {
  const result: Finding[][] = [];
  let length = 0;
  for (const finding of findings) {
    if (!result.length || result[result.length - 1].length >= 3 || length + finding.statement.length > 1050) {
      result.push([]);
      length = 0;
    }
    result[result.length - 1].push(finding);
    length += finding.statement.length;
  }
  return result;
}

export function CompanyBrief({ company, backHref }: { company: CompanyGuide; backHref: string }) {
  const topics = guideTopics.filter(([topic]) => company.findings.some((finding) => finding.topic === topic));
  const sources = new Map<string, Finding["citations"][number]>();
  for (const [topic] of topics) {
    for (const finding of company.findings.filter((item) => item.topic === topic)) {
      for (const citation of finding.citations) if (!sources.has(citation.url)) sources.set(citation.url, citation);
    }
  }
  const sourceNumbers = new Map([...sources.keys()].map((url, index) => [url, index + 1]));
  const bodyId = `${company.id}-findings`;
  const sourceId = `${company.id}-sources`;
  const findingId = (id: string) => `${company.id}-${id}`;

  return <div className="career-guide career-guide-detail">
    <Link className="career-guide-back" href={backHref}><ArrowLeft size={15} /> All company research</Link>
    <div className="eyebrow">Reviewed company brief · {company.reviewedAt}</div>
    <div className="career-guide-brief-header">
      <div><h1>{company.name}</h1><p className="career-guide-brief-meta">{company.findings.length} findings · {topics.length} topics · {sources.size} sources</p></div>
      <label className="career-guide-source-toggle"><input className="career-guide-source-switch" type="checkbox" aria-controls={`${bodyId} ${sourceId}`} /> <span>Show sources</span></label>
    </div>
    <p className="career-guide-snapshot">Reviewed snapshot, not a live vacancy board. Group, legal-entity and role scopes differ; check current openings with the employer.</p>
    <nav className="career-guide-toc" aria-label="Company brief sections">{topics.map(([topic, label]) => <a key={topic} href={`#${topic}`}>{label}</a>)}</nav>
    <div className="career-guide-topic-grid" id={bodyId}>
      {topics.map(([topic, label]) => {
        const findings = company.findings.filter((finding) => finding.topic === topic);
        return <section className="career-guide-topic" id={topic} key={topic} aria-labelledby={`${company.id}-${topic}-heading`}>
          <div className="career-guide-topic-heading"><span>{String(guideTopics.findIndex(([item]) => item === topic) + 1).padStart(2, "0")}</span><h2 id={`${company.id}-${topic}-heading`}>{label}</h2></div>
          {paragraphs(findings).map((group) => <p className="career-guide-paragraph" key={group[0].id}>{group.map((finding, index) => <span id={findingId(finding.id)} data-finding-id={finding.id} key={finding.id}>{index > 0 && " "}{finding.statement}<sup className="career-guide-source-mark">{finding.citations.map((citation) => <a key={citation.url} href={citation.url} target="_blank" rel="noopener noreferrer" title={`${citation.publisher}: ${citation.title}`} aria-label={`Source ${sourceNumbers.get(citation.url)}: ${citation.publisher}: ${citation.title} (opens in new tab)`}>[{sourceNumbers.get(citation.url)}]</a>)}</sup></span>)}</p>)}
        </section>;
      })}
    </div>
    {!!company.roles.length && <section className="career-guide-extra career-guide-roles"><h2>Role briefs</h2><p>Source-snapshot roles; inclusion does not mean applications are still open.</p><ul>{company.roles.map((role, index) => <li key={`${role.title}-${index}`}><strong>{role.title}</strong><span>{role.office}</span></li>)}</ul></section>}
    <div className="career-guide-research-notes">
      <details className="career-guide-extra career-guide-context"><summary>Scope and research context</summary><p>{company.entityName}</p><ol>{topics.flatMap(([topic, label]) => company.findings.filter((finding) => finding.topic === topic).map((finding, index) => <li key={finding.id}><a href={`#${findingId(finding.id)}`}>{label} {index + 1}</a><span>Scope: {finding.scope}{finding.eventDate ? ` · Event date: ${finding.eventDate}` : ""}</span></li>))}</ol></details>
      {!!company.gaps.length && <details className="career-guide-extra"><summary>Evidence gaps <span>{company.gaps.length}</span></summary><ul>{company.gaps.map((gap, index) => <li key={index}><strong>{gap.topic}</strong><span>{gap.description}</span></li>)}</ul></details>}
      {!!company.openQuestions.length && <details className="career-guide-extra"><summary>Questions to verify <span>{company.openQuestions.length}</span></summary><ul>{company.openQuestions.map((question, index) => <li key={index}>{question}</li>)}</ul></details>}
    </div>
    <section className="career-guide-extra career-guide-source-list" id={sourceId} aria-label="Sources">
      <h2>Sources</h2><ol>{[...sources.values()].map((source) => <li key={source.url}><sup><a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Source ${sourceNumbers.get(source.url)}: ${source.publisher}: ${source.title} (opens in new tab)`}>[{sourceNumbers.get(source.url)}]</a></sup><div><strong>{source.publisher}</strong><span>{source.title}</span><small>Retrieved {source.retrievedAt}</small></div></li>)}</ol>
    </section>
  </div>;
}
