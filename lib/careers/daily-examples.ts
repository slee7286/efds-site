export type CareerExample = { name: string; url: string };

const finance: CareerExample[] = [
  { name: "Goldman Sachs", url: "https://www.goldmansachs.com/careers/our-firm/investment-banking" },
  { name: "JPMorganChase", url: "https://www.jpmorganchase.com/careers/explore-opportunities" },
  { name: "BlackRock", url: "https://careers.blackrock.com/" },
  { name: "Morgan Stanley", url: "https://www.morganstanley.com/people" },
];

const consulting: CareerExample[] = [
  { name: "Boston Consulting Group", url: "https://careers.bcg.com/global/en" },
  { name: "McKinsey & Company", url: "https://www.mckinsey.com/careers/home" },
  { name: "EY Consulting", url: "https://www.ey.com/en_uk/careers/students" },
  { name: "Deloitte", url: "https://www.deloitte.com/uk/en/careers.html" },
];

export const fixedCareerExamples: Record<"quantitativeResearch" | "economicsPolicy", CareerExample[]> = {
  quantitativeResearch: [
    { name: "Optiver", url: "https://www.optiver.com/join-us/jobs/quantitative-research-and-machine-learning/" },
    { name: "Jane Street", url: "https://www.janestreet.com/quantitative-research/" },
  ],
  economicsPolicy: [
    { name: "Cornerstone Research", url: "https://www.cornerstone.com/about/about-us/" },
  ],
};

export const rotatingCareerExamples = { finance, consulting } as const;
export type RotatingCareerArea = keyof typeof rotatingCareerExamples;

function londonDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function hash(value: string): number {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function dailyCareerExample(area: RotatingCareerArea, date = new Date()): CareerExample {
  const pool = rotatingCareerExamples[area];
  const day = londonDateKey(date);
  const ordinal = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
  // Alternating halves guarantee a fresh firm tomorrow; the hash chooses one
  // of two firms within today's half and is stable across visitors.
  const index = (ordinal % 2) * 2 + hash(`${area}:${day}`) % 2;
  return pool[index];
}
