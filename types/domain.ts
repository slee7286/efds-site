export type AccessRole = "member" | "committee" | "admin" | "viewer";
export type MemberType = "imperial" | "external" | "alumni" | "departmental_representative" | "other";
export type AgentScope = "public" | "member" | "committee" | "admin";
export type KnowledgeType = "requirement" | "timing_rule" | "process" | "process_step" | "resource" | "contact";
export type ReviewStatus = "proposed" | "approved" | "rejected" | "needs_review" | "superseded";
export type KnowledgeVisibility = "internal" | "committee" | "member" | "public";

export interface DocumentArchiveItem {
  id: string;
  title: string;
  documentType: string | null;
  sourceType: string | null;
  sourceRoot: string | null;
  relativePath: string | null;
  sourceArea: string | null;
  mimeType: string | null;
  extension: string | null;
  fileSizeBytes: number | null;
  contentHash: string | null;
  extractionStatus: string | null;
  extractionError: string | null;
  isMissing: boolean;
  isUnavailable: boolean;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastSyncedAt: string | null;
  lastChangedAt: string | null;
  filesystemModifiedAt: string | null;
  duplicateCount: number;
}

export interface DocumentArchiveVersion {
  id: string;
  contentHash: string;
  rawText: string | null;
  extractionStatus: string;
  extractionError: string | null;
  mimeType: string | null;
  sourceModifiedAt: string | null;
  fileSizeBytes: number | null;
  ingestedAt: string | null;
}

export interface DocumentArchiveChange {
  id: string;
  changeType: string;
  previousPath: string | null;
  newPath: string | null;
  previousContentHash: string | null;
  newContentHash: string | null;
  detectedAt: string | null;
}

export interface SlackChannel {
  id: string;
  workspaceId: string | null;
  name: string;
  topic: string | null;
  purpose: string | null;
  isPrivate: boolean;
  archived: boolean;
  syncEnabled: boolean;
  lastSyncedAt: string | null;
  messageCount: number;
  latestMessageAt: string | null;
}

export interface SlackMessage {
  id: string;
  channelId: string;
  channelName: string;
  slackTs: string;
  threadTs: string | null;
  parentMessageId: string | null;
  authorUserId: string | null;
  authorName: string;
  text: string | null;
  subtype: string | null;
  sourcePostedAt: string | null;
  sourceEditedAt: string | null;
  permalink: string | null;
  contentHash: string | null;
  isDeleted: boolean;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastChangedAt: string | null;
  reactions: { name: string; slackUserId: string }[];
  links: { url: string; domain: string | null }[];
  files: { id: string; filename: string | null; title: string | null; mimeType: string | null; sizeBytes: number | null; permalink: string | null }[];
}

export interface SlackMessageChange {
  id: string;
  changeType: string;
  previousContentHash: string | null;
  newContentHash: string | null;
  previousText: string | null;
  newText: string | null;
  sourceEditedAt: string | null;
  detectedAt: string;
}

export interface AccessProfile {
  id: string;
  authUserId: string;
  email: string;
  fullName: string | null;
  accessRole: AccessRole;
  memberType: MemberType;
  officerId: string | null;
  active: boolean;
  lastLoginAt: string | null;
}

export interface AccessException {
  email: string;
  accessRole: AccessRole;
  memberType?: MemberType | null;
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
  sourceType?: string;
  contentHash?: string | null;
  rawHtml?: string | null;
  firstSeenAt?: string | null;
  lastCheckedAt?: string | null;
  lastChangedAt?: string | null;
  crawledAt?: string | null;
  relevanceConfidence?: number | null;
  relevanceMethod?: string | null;
  relevanceEvidence?: string | null;
  extractionHash?: string | null;
  extractedAt?: string | null;
  extractionRunId?: string | null;
}

export interface KnowledgeRequirement {
  id: string;
  text: string;
  type: string;
  appliesTo: string | null;
  mandatory: boolean | null;
  reviewStatus: string;
  sourceArticleId: string;
  source?: KnowledgeSource;
  confidence?: number | null;
  extractionMethod?: string | null;
  extractedAt?: string | null;
  sourceContentHash?: string | null;
  sourceUpdatedAt?: string | null;
  evidenceText?: string | null;
  isStale?: boolean;
  visibility?: KnowledgeVisibility;
  reviewedAt?: string | null;
  reviewerName?: string | null;
}

export interface KnowledgeSource {
  articleId: string;
  title: string;
  url: string | null;
  contentHash: string | null;
  sourceUpdatedAt: string | null;
  lastChangedAt?: string | null;
}

export interface KnowledgeReviewItem {
  id: string;
  knowledgeType: KnowledgeType;
  normalizedText: string;
  secondaryText?: string | null;
  source: KnowledgeSource;
  evidenceText: string;
  confidence: number | null;
  extractionMethod: string;
  extractedAt: string | null;
  reviewStatus: ReviewStatus;
  isStale: boolean;
  visibility: KnowledgeVisibility;
  reviewedAt: string | null;
  reviewerName: string | null;
  topicLabel: string | null;
  roleLabels: string[];
  roleIds: string[];
  reviewVersion: number;
  metadata: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export interface KnowledgeReviewEvent {
  id: string;
  knowledgeType: KnowledgeType;
  knowledgeRecordId: string;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  changes: Record<string, unknown>;
  createdAt: string;
  reviewerName: string | null;
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
