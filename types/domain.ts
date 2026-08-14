export type AccessRole = "member" | "committee" | "admin" | "viewer";
export type MemberType = "imperial" | "external" | "alumni" | "departmental_representative" | "other";
export type AgentScope = "public" | "member" | "committee" | "admin";
export type KnowledgeType = "requirement" | "timing_rule" | "process" | "process_step" | "resource" | "contact";
export type ReviewStatus = "proposed" | "approved" | "rejected" | "needs_review" | "superseded";
export type KnowledgeVisibility = "internal" | "committee" | "member" | "public";
export type OperationalRecordType = "decision" | "action_item" | "commitment" | "open_question" | "status_update";
export type OperationalReviewStatus = "proposed" | "approved" | "rejected" | "needs_review" | "superseded";
export type OperationalExecutionStatus = "open" | "in_progress" | "blocked" | "completed" | "cancelled" | "answered" | "resolved" | "closed";

export type RetrievalSourceType = "icu_article" | "knowledge_requirement" | "knowledge_timing_rule" | "knowledge_process" | "knowledge_process_step" | "knowledge_resource" | "knowledge_contact" | "document" | "slack_message" | "meeting_transcript" | "meeting_summary" | "meeting_notes" | "operational_decision" | "operational_action" | "operational_commitment" | "operational_question" | "operational_status";

export interface UnifiedRetrievalResult {
  retrievalUnitId: string; sourceType: RetrievalSourceType; sourceRecordId: string;
  sourceParentId: string | null; sourceVersionId: string | null; title: string; snippet: string; score: number;
  sourceArea: string | null; topic: string | null; channel: string | null; author: string | null;
  occurredAt: string | null; sourceUpdatedAt: string | null; reviewStatus: string | null;
  visibility: KnowledgeVisibility | null; isCurrent: boolean; isStale: boolean;
  sourceUrl: string | null; permalink: string | null; relativePath: string | null; contentHash: string | null;
  metadata: Record<string, unknown>; authority?: string | null; lexicalRank?: number | null; semanticRank?: number | null;
  semanticSimilarity?: number | null; hybridScore?: number | null; scoreComponents?: Record<string, number>;
}

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

export interface MeetingArchiveItem {
  id: string;
  title: string;
  externalMeetingId: string | null;
  meetingType: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  sourceType: string;
  status: string;
  sourceCreatedAt: string | null;
  sourceUpdatedAt: string | null;
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  lastChangedAt: string | null;
  isMissing: boolean;
  transcriptAvailable: boolean;
  summaryAvailable: boolean;
}

export interface MeetingArtifact {
  id: string;
  artifactType: "transcript" | "summary" | "notes" | string;
  sourceRecordId: string | null;
  sourceReference: string | null;
  content: string;
  contentHash: string;
  format: string | null;
  sourceCreatedAt: string | null;
  sourceUpdatedAt: string | null;
  ingestedAt: string | null;
  isCurrent: boolean;
  generatedBy: string | null;
  reviewStatus: string;
  summaryTemplate: string | null;
}

export interface MeetingTranscriptSegment {
  id: string;
  artifactId: string;
  sequence: number;
  startMs: number | null;
  endMs: number | null;
  speaker: string | null;
  text: string;
}

export interface MeetingSourceChange {
  id: string;
  changeType: string;
  previousHash: string | null;
  newHash: string | null;
  previousValue: string | null;
  newValue: string | null;
  detectedAt: string | null;
}

export interface OperationalRecord {
  id: string;
  recordType: OperationalRecordType;
  title: string;
  description: string | null;
  priority: string | null;
  ownerProfileId: string | null;
  ownerOfficerId: string | null;
  ownerText: string | null;
  dueAt: string | null;
  dueText: string | null;
  occurredAt: string | null;
  workstream: string | null;
  executionStatus: OperationalExecutionStatus | null;
  reviewStatus: OperationalReviewStatus;
  visibility: KnowledgeVisibility;
  isCurrent: boolean;
  reviewVersion: number;
  createdAt: string | null;
  updatedAt: string | null;
  reviewedAt: string | null;
  completedAt: string | null;
  resolvedAt: string | null;
  supersededById: string | null;
}

export interface OperationalEvidence {
  id: string;
  retrievalUnitId: string;
  sourceType: string;
  sourceRecordId: string;
  sourceVersionId: string | null;
  title: string | null;
  evidenceText: string | null;
  evidenceRole: string;
  createdAt: string | null;
}

export interface OperationalReviewEvent {
  id: string;
  action: string;
  previousReviewStatus: string | null;
  newReviewStatus: string | null;
  reviewerProfileId: string;
  reason: string | null;
  changes: Record<string, unknown>;
  createdAt: string | null;
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
