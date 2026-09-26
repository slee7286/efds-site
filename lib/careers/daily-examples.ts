export type CareerExample = { name: string; guideId: string };

const finance: CareerExample[] = [
  { name: "Goldman Sachs", guideId: "goldman-sachs-c27b1107" },
  { name: "Barclays", guideId: "barclays-8dd79439" },
  { name: "BlackRock", guideId: "blackrock-86a62f4a" },
  { name: "Morgan Stanley", guideId: "morgan-stanley-1a00a520" },
];

const consulting: CareerExample[] = [
  { name: "Boston Consulting Group", guideId: "bcg-b4037147" },
  { name: "Bain & Company", guideId: "bain-company-9fdef41c" },
  { name: "Oliver Wyman", guideId: "oliver-wyman-6ff419e9" },
  { name: "FTI Consulting", guideId: "fti-consulting-bcfba263" },
];

export const fixedCareerExamples: Record<"quantitativeResearch" | "economicsPolicy", CareerExample[]> = {
  quantitativeResearch: [
    { name: "Optiver", guideId: "optiver-3507fe20" },
    { name: "Jane Street", guideId: "jane-street-79bab30d" },
  ],
  economicsPolicy: [
    { name: "Cornerstone Research", guideId: "cornerstone-research-cd3ff5bd" },
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
