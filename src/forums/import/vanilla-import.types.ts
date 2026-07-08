/**
 * Normalized importer stage names used by orchestration and report output.
 */
export type VanillaImportStageName =
  | 'topics'
  | 'replies'
  | 'watches'
  | 'readState'
  | 'memberBans'
  | 'ipBans';

/**
 * Minimal legacy actor fields required to resolve a Vanilla user to a
 * Topcoder member snapshot.
 */
export interface VanillaLegacyActor {
  legacyUserId: string;
  handle: string | null;
  email: string | null;
}

/**
 * Normalized Vanilla discussion row consumed by the topic import stage.
 */
export interface VanillaDiscussionRow {
  discussionId: string;
  challengeId: string | null;
  title: string;
  body: string | null;
  isAnnouncement: boolean;
  locked: boolean;
  createdAt: Date;
  updatedAt: Date;
  actor: VanillaLegacyActor;
}

/**
 * Normalized Vanilla comment row consumed by the reply import stage.
 */
export interface VanillaReplyRow {
  replyId: string;
  discussionId: string;
  parentReplyId: string | null;
  body: string | null;
  createdAt: Date;
  updatedAt: Date;
  actor: VanillaLegacyActor;
}

/**
 * Normalized Vanilla subscription row consumed by the watch import stage.
 */
export interface VanillaWatchRow {
  discussionId: string;
  createdAt: Date;
  actor: VanillaLegacyActor;
}

/**
 * Normalized Vanilla read marker consumed by the read-state import stage.
 */
export interface VanillaReadStateRow {
  discussionId: string;
  readAt: Date;
  actor: VanillaLegacyActor;
}

/**
 * Normalized active legacy member ban consumed by the member-ban stage.
 */
export interface VanillaMemberBanRow {
  banId: string;
  createdAt: Date;
  actor: VanillaLegacyActor;
}

/**
 * Normalized active legacy IP ban consumed by the IP-ban stage.
 */
export interface VanillaIpBanRow {
  banId: string;
  ipAddress: string;
  createdAt: Date;
}

/**
 * Successful Topcoder member mapping result, including the current handle
 * snapshot to persist on imported forum content.
 */
export interface VanillaMatchedMember {
  status: 'matched';
  legacyUserId: string;
  memberId: string;
  handle: string;
  matchedBy: 'handle' | 'email';
}

/**
 * Unsuccessful Topcoder member mapping result with a reason suitable for the
 * import report.
 */
export interface VanillaUnmatchedMember {
  status: 'unmatched';
  legacyUserId: string;
  reason: string;
}

/**
 * Full member mapping result returned by the importer mapper.
 */
export type VanillaMemberMappingResult =
  | VanillaMatchedMember
  | VanillaUnmatchedMember;

/**
 * Target identifiers produced after a discussion is imported.
 */
export interface ImportedTopicTarget {
  topicId: string;
  starterPostId: string;
}

/**
 * Preflight target table counts included in console failures and reports.
 */
export interface VanillaTargetCounts {
  topics: number;
  posts: number;
  topicClosures: number;
  topicWatches: number;
  topicReadStates: number;
  memberBans: number;
  ipBans: number;
}

/**
 * Result of a preflight dependency check.
 */
export interface VanillaPreflightCheckResult {
  ok: boolean;
  message?: string;
}

/**
 * Complete preflight report section persisted before any source reads.
 */
export interface VanillaPreflightReport {
  ok: boolean;
  targetCounts: VanillaTargetCounts;
  forumsDb: VanillaPreflightCheckResult;
  membersDb: VanillaPreflightCheckResult;
  challengeDb: VanillaPreflightCheckResult;
  vanillaDb: VanillaPreflightCheckResult;
  reportPath: VanillaPreflightCheckResult;
}

/**
 * Minimal per-record report entry for an imported source row.
 */
export interface VanillaImportedRecord {
  sourceId: string;
  targetId: string;
  detail?: Record<string, string | number | boolean | null>;
}

/**
 * Minimal per-record report entry for a skipped source row.
 */
export interface VanillaSkippedRecord {
  sourceId: string;
  reason: string;
  detail?: Record<string, string | number | boolean | null>;
}

/**
 * Minimal per-record report entry for a failed source row.
 */
export interface VanillaFailedRecord {
  sourceId: string;
  error: string;
  detail?: Record<string, string | number | boolean | null>;
}

/**
 * Mutable import stage report with counters and per-record details.
 */
export interface VanillaStageReport {
  read: number;
  imported: number;
  skipped: number;
  failed: number;
  importedRecords: VanillaImportedRecord[];
  skippedRecords: VanillaSkippedRecord[];
  failedRecords: VanillaFailedRecord[];
}

/**
 * Final JSON report shape emitted by the importer.
 */
export interface VanillaImportReport {
  metadata: {
    startedAt: string;
    completedAt: string | null;
    durationMs: number | null;
    command: string[];
    reportPath: string;
    recoveryModel: string;
    status: 'running' | 'completed' | 'failed';
    error?: string;
  };
  preflight: VanillaPreflightReport | null;
  memberMapping: {
    totalLegacyActors: number;
    matchedByHandle: number;
    matchedByEmail: number;
    unmatched: number;
    entries: Array<{
      legacyUserId: string;
      status: 'matched' | 'unmatched';
      matchedBy?: 'handle' | 'email';
      memberId?: string;
      reason?: string;
    }>;
  };
  stages: Record<VanillaImportStageName, VanillaStageReport>;
}

/**
 * Options passed from the CLI entrypoint to the import orchestrator.
 */
export interface VanillaImportRunOptions {
  reportPath: string;
  command: string[];
}

/**
 * Summary returned to the CLI after the report has been written.
 */
export interface VanillaImportRunSummary {
  reportPath: string;
  status: 'completed' | 'failed';
  stages: Record<
    VanillaImportStageName,
    Pick<VanillaStageReport, 'read' | 'imported' | 'skipped' | 'failed'>
  >;
}
