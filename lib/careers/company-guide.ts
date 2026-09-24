import guide from "@/data/company-research.json";

export type CompanyGuide = (typeof guide.companies)[number];
export const companyGuide = guide;
export const guideTopics = [
  ["business", "What the company does"],
  ["teams", "Teams and structure"],
  ["differentiators", "What distinguishes its approach"],
  ["work", "The work"],
  ["direction", "Direction and developments"],
  ["risks", "Risks and constraints"],
  ["recruiting", "Recruiting evidence"],
] as const;

export function getGuideCompany(id: string) {
  return guide.companies.find((company) => company.id === id);
}
