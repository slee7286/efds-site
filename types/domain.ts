export type AccessRole = "member" | "committee" | "admin" | "viewer";
export type MemberType = "imperial" | "external" | "alumni" | "departmental_representative" | "other";
export type AgentScope = "public" | "member" | "committee" | "admin";

export interface AccessProfile {
  authUserId: string;
  email: string;
  fullName: string | null;
  accessRole: AccessRole;
  memberType: MemberType;
  active: boolean;
}

export interface AccessException {
  email: string;
  accessRole: AccessRole;
  active: boolean;
  expiresAt?: string | null;
}

export interface KnowledgeArticle {
  id: string;
  externalId: string | null;
  title: string;
  url: string | null;
  category: string | null;
  folder: string | null;
  markdown: string | null;
  sourceUpdatedAt: string | null;
  relevance: "critical" | "high" | "medium" | "low" | "irrelevant";
  reviewStatus: "proposed" | "approved" | "rejected";
  isStale: boolean;
}

export interface KnowledgeRequirement {
  id: string;
  text: string;
  type: string;
  appliesTo: string | null;
  mandatory: boolean | null;
  reviewStatus: string;
  sourceArticleId: string;
}

export interface KnowledgeSummary {
  articleCount: number;
  highRelevanceCount: number;
  proposedCount: number;
  staleCount: number;
  lastSyncedAt: string | null;
}

export interface PublicOfficer {
  name: string;
  role: string;
  academicYear: string;
}

export interface PublicEvent {
  title: string;
  date: string;
  type: string;
  description: string;
  accent: "yellow" | "mint" | "blue";
}

export type JobStatus = "interested" | "preparing" | "applied" | "OA" | "interview" | "final_round" | "offer" | "rejected" | "withdrawn";

export interface TrackedJob {
  company: string;
  role: string;
  careerArea: string;
  location: string;
  deadline: string | null;
  status: JobStatus;
  nextAction: string | null;
}
