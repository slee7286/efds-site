import type { PublicEvent, PublicOfficer } from "@/types/domain";

// Public officers listed by Imperial College Union; checked 22 September 2026.
// Source: https://www.imperialcollegeunion.org/activities/a-to-z/efds-soc
export async function getPublicCommittee(): Promise<PublicOfficer[]> {
  return [
    ["Siheon Lee", "President"], ["Yifan Dai", "Vice President"],
    ["Teja Sule", "Secretary"], ["Katia Bubenok-Honchar", "Treasurer"],
    ["Shashwat Sarawagi", "Events / Trips Officer"], ["Queena Zeng", "Social Secretary"],
    ["Hannah Khalique", "Committee Member"], ["Iphazha Masala", "Committee Member"],
    ["Alice Ye", "Committee Member"], ["Nikodem Brol", "Committee Member"],
    ["Eesa Jaswal", "Committee Member"], ["Tanuj Kakumani", "Committee Member"],
  ].map(([name, role]) => ({ name, role, academicYear: "" }));
}

export async function getUpcomingEvents(): Promise<PublicEvent[]> {
  // No verified published event feed is connected yet. Do not publish the old
  // illustrative dates as confirmed society events.
  return [];
}
