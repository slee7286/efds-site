import type { Metadata } from "next";
import Link from "next/link";
import { InformationCard, InformationPage } from "../../../components/public/information-page";

export const metadata: Metadata = { title: "Terms", description: "Terms for using the EFDS Society website and member workspace." };

export default function TermsPage() {
  return <InformationPage eyebrow="Terms" title="Use the society space well." intro="These practical terms describe the expected use of the EFDS public website and its authenticated member workspace.">
    <InformationCard eyebrow="Scope" title="A society website and workspace"><p>These terms apply to the public EFDS Society website, its resources, event information, public assistant, and the authenticated member, committee, and administrator areas.</p></InformationCard>
    <InformationCard eyebrow="Access" title="Use only the access meant for you"><ul><li>Public pages are available to everyone.</li><li>Authenticated access is for an eligible Imperial account or an explicitly approved external account.</li><li>Do not share sign-in links, impersonate another person, bypass access controls, or use another person’s account.</li><li>Access can be suspended or revoked when an account is inactive, an exception expires, or the service is misused.</li></ul></InformationCard>
    <InformationCard eyebrow="Good use" title="Keep member information trustworthy"><p>Use the job, opportunity, planning, and other workspace features honestly. Do not enter information that you know is false, unlawful, harmful, confidential to someone else, or unrelated to the society’s purposes.</p><p>Do not copy, disclose, scrape, or redistribute private committee, member, operational, or internal knowledge without permission.</p></InformationCard>
    <InformationCard eyebrow="Chat and agents" title="Respect the scope of each assistant"><p>Use chat and agent features for reasonable EFDS questions and tasks. Do not attempt to make an assistant reveal private data, bypass its assigned scope, escalate your role, or process secrets and credentials.</p></InformationCard>
    <InformationCard eyebrow="Information" title="Resources can change"><p>Event dates, opportunities, links, and career information may change or become unavailable. Career and academic content is general information, not professional, admissions, legal, financial, or employment advice. External opportunities are controlled by their respective third parties.</p><p>Third-party links are provided for convenience. Their content and terms are not controlled by EFDS.</p></InformationCard>
    <InformationCard eyebrow="Ownership and availability" title="A student society service"><p>EFDS and its contributors retain their rights in original website content, branding, and materials. Respect third-party rights in linked or source material. The site and its availability may change as the society’s needs and committee year change.</p></InformationCard>
    <InformationCard eyebrow="Questions and changes" title="Talk to the society"><p>Questions about access, content, privacy, or these terms can be raised through <Link href="/contact">/contact</Link>. EFDS may update these terms when the website or society operations change; the current version will be published on this page.</p></InformationCard>
  </InformationPage>;
}
