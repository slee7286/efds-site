import type { PublicEvent, PublicOfficer } from "@/types/domain";

export async function getPublicCommittee(): Promise<PublicOfficer[]> {
  return [
    { name: "EFDS Committee", role: "2026–27 committee", academicYear: "2026–27" },
    { name: "Economics, Finance & Data Science", role: "Imperial College London", academicYear: "" },
  ];
}

export async function getUpcomingEvents(): Promise<PublicEvent[]> {
  return [
    { title: "Welcome to EFDS", date: "18 Sep 2026", type: "Social", description: "Meet the committee, find your people and start the year with a clear signal.", accent: "yellow" },
    { title: "Quantitative finance evening", date: "01 Oct 2026", type: "Industry", description: "A practical conversation on markets, models and the work behind the numbers.", accent: "mint" },
    { title: "EFDS Data Challenge", date: "22 Oct 2026", type: "Competition", description: "Form a team, investigate a real dataset and present the insight that matters.", accent: "blue" },
  ];
}
