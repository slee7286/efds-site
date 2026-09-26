import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { publicCareerExamples, getPublicGuideCompany } from "@/lib/careers/public-guide";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Featured company research", description: "Source-backed reviewed briefs for the firms featured on the EFDS careers page." };

export default function PublicGuidePage() {
  return <main id="main-content" className="container public-career-guide">
    <div className="career-guide"><Link className="career-guide-back" href="/careers">← Careers</Link><div className="eyebrow">Public company research</div><h1>Know the<br /><em>company.</em></h1><p className="app-subtitle">Reviewed, sourced research on the firms featured in the public careers page. This is a research snapshot, not a live vacancy board. Check the employer for current details.</p>
      <section className="career-guide-results" aria-label="Featured companies"><div className="career-guide-results-heading"><span>Featured company briefs</span><span>Public evidence · editorially reviewed</span></div>
        {publicCareerExamples.map((example, index) => {
          const company = getPublicGuideCompany(example.guideId);
          if (!company) return null;
          return <Link className="career-guide-row" href={`/careers/guide/${example.guideId}`} key={example.guideId}><span className="career-guide-row-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{example.name}</h2><p>{company.findings.find((finding) => finding.topic === "business")?.statement ?? "Read the reviewed company brief."}</p></div><span className="career-guide-row-count">{company.findings.length} findings</span><ArrowUpRight size={19} aria-hidden="true" /></Link>;
        })}
      </section>
    </div>
  </main>;
}
