import { getGuideCompany } from "@/lib/careers/company-guide";
import { fixedCareerExamples, rotatingCareerExamples } from "@/lib/careers/daily-examples";

// Only firms explicitly featured on the public careers page may bypass the
// student gate. Keep this list tied to the rotating and fixed example pools.
export const publicCareerExamples = [
  ...rotatingCareerExamples.finance,
  ...rotatingCareerExamples.consulting,
  ...fixedCareerExamples.quantitativeResearch,
  ...fixedCareerExamples.economicsPolicy,
];

const publicIds = new Set(publicCareerExamples.map((example) => example.guideId));

export function getPublicGuideCompany(id: string) {
  return publicIds.has(id) ? getGuideCompany(id) : undefined;
}
