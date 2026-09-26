import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { CompanyBrief } from "@/components/careers/company-brief";
import { getGuideCompany } from "@/lib/careers/company-guide";
import { getCurrentProfile } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export default async function CompanyGuideDetailPage({ params }: { params: Promise<{ company: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile || !hasMinimumRole(profile.accessRole, "efds_member")) return <div className="app-content career-guide"><div className="eyebrow">Career workspace / company research</div><h1>EFDS student access required.</h1><p className="app-subtitle">The company research library is reserved for verified students on Imperial’s BSc Economics, Finance and Data Science. EFDS Union society membership alone does not grant access.</p><Link className="button button-primary" href="/dashboard/profile">Request student verification <ArrowUpRight size={15} /></Link></div>;
  const { company: id } = await params;
  const company = getGuideCompany(id);
  if (!company) notFound();
  return <div className="app-content"><CompanyBrief company={company} backHref="/dashboard/careers/guide" /></div>;
}
