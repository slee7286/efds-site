import { notFound } from "next/navigation";
import { CompanyBrief } from "@/components/careers/company-brief";
import { getPublicGuideCompany } from "@/lib/careers/public-guide";

export const dynamic = "force-dynamic";

export default async function PublicBriefPage({ params }: { params: Promise<{ company: string }> }) {
  const { company: id } = await params;
  const company = getPublicGuideCompany(id);
  if (!company) notFound();
  return <main id="main-content" className="container public-career-guide"><CompanyBrief company={company} backHref="/careers/guide" /></main>;
}
