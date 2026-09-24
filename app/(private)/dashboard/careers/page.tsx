import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/server";
import { hasMinimumRole } from "@/lib/auth/roles";
import { companyGuide } from "@/lib/careers/company-guide";
import { society } from "@/lib/public-content";

export default async function PrivateCareersPage() {
  const profile = await getCurrentProfile();
  const verified = !!profile && hasMinimumRole(profile.accessRole, "efds_member");
  return <div className="app-content career-guide career-workspace"><div className="eyebrow">Career workspace</div><h1>Choose with<br /><em>evidence.</em></h1><p className="app-subtitle">Explore a field, research an employer and verify the current role before you apply.</p><div className="career-workspace-grid"><section className="career-workspace-feature"><span className="eyebrow">01 / Company research</span><BookOpen size={30} aria-hidden="true" /><h2>{verified ? `${companyGuide.companies.length} reviewed company briefs.` : "A company guide for EFDS students."}</h2><p>Explore sourced evidence on businesses, teams, work, direction, risks and recruiting. The guide is a research snapshot, not a live job board. EFDS Union society membership alone does not grant access.</p>{verified ? <Link className="button button-paper" href="/dashboard/careers/guide">Open the company guide <ArrowUpRight size={15} /></Link> : <Link className="button button-paper" href="/dashboard/profile">Request student verification <ArrowUpRight size={15} /></Link>}</section><section className="career-workspace-secondary"><Compass size={24} aria-hidden="true" /><h2>Find your direction.</h2><p>Compare economics, finance, data science and related paths, then use Imperial’s Careers Service for current opportunities and individual support.</p><Link className="text-link" href="/careers">Explore career paths <ArrowUpRight size={15} /></Link><a className="text-link" href={society.careersUrl} target="_blank" rel="noreferrer">Imperial Careers Service <ArrowUpRight size={15} /></a></section></div></div>;
}
