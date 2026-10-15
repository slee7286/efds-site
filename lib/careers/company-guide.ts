import guide from "@/data/company-research.json";
import displayNames from "@/data/company-display-names.json";

// Editorial labels live outside the generated research so imports cannot replace
// them. Keep the original identity scope available within each reviewed brief.
const names: Record<string, string> = displayNames;
export const companyGuide = {
  ...guide,
  companies: guide.companies.map((company) => ({
    ...company,
    name: names[company.id] ?? company.name,
    entityName: company.name,
  })).sort((a, b) => a.name.localeCompare(b.name, "en")),
};
export type CompanyGuide = (typeof companyGuide.companies)[number];
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
  return companyGuide.companies.find((company) => company.id === id);
}
