import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { companyGuide } from "@/lib/careers/company-guide";
import { getCurrentProfile } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function CareerGuidePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await getCurrentProfile();
  const allowed = !!profile && hasMinimumRole(profile.accessRole, "efds_member");
  const { q } = await searchParams;
  const query = (q || "").trim().slice(0, 100);
  const matches = allowed ? companyGuide.companies.filter((company) => !query || [company.name, ...company.findings.map((finding) => finding.statement)].join(" ").toLowerCase().includes(query.toLowerCase())) : [];
  return <div className="app-content career-guide">
    <div className="eyebrow">Career workspace / company research</div>
    <div className="career-guide-hero"><div><h1>Know the<br /><em>company.</em></h1><p className="app-subtitle">Research the business, teams, work, direction, risks and recruiting evidence before you decide where to apply.</p></div><span className="career-guide-index">{allowed ? String(companyGuide.companies.length).padStart(2, "0") : "—"}<small>reviewed<br />company briefs</small></span></div>
    {!allowed ? <section className="surface career-guide-access"><h2>Verified EFDS students can read the full guide.</h2><p>Access is not available to non-EFDS students, even if they hold EFDS Union society membership. You can still use the public careers page and Imperial Careers Service. If you study Imperial’s BSc Economics, Finance and Data Science, request student verification.</p><Link className="button button-primary" href="/dashboard/profile">Request student verification <ArrowUpRight size={15} /></Link></section> : <>
      <div className="career-guide-note"><strong>Research snapshot · 25 September 2026</strong><p>These are reviewed summaries of public employer sources, not a live vacancy board or an endorsement. Roles, eligibility and deadlines can change. Verify current details on each employer’s website before applying.</p></div>
      <form className="career-guide-search" method="get"><Search size={18} aria-hidden="true" /><label className="sr-only" htmlFor="company-guide-search">Search companies and research</label><input id="company-guide-search" name="q" type="search" placeholder="Search companies, teams or research themes" defaultValue={query} /><button type="submit">Search</button></form>
      <section className="career-guide-results" aria-label="Reviewed companies"><div className="career-guide-results-heading"><span>{matches.length} {matches.length === 1 ? "company" : "companies"}{query ? ` matching “${query}”` : " in the guide"}</span><span>Public evidence · editorially reviewed</span></div>{matches.map((company, index) => <Link className="career-guide-row" href={`/dashboard/careers/guide/${company.id}`} key={company.id}><span className="career-guide-row-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{company.name}</h2><p>{company.findings.find((finding) => finding.topic === "business")?.statement ?? "Read the reviewed company brief."}</p></div><span className="career-guide-row-count">{company.findings.length} findings</span><ArrowUpRight size={19} aria-hidden="true" /></Link>)}{!matches.length && <div className="career-guide-no-results"><h2>No company matches.</h2><p>Try a company name, team or research theme.</p><Link href="/dashboard/careers/guide">Clear search</Link></div>}</section>
    </>}
  </div>;
}
