import { Injectable, Logger } from '@nestjs/common';
import {
  ImportedTopicTarget,
  VanillaImportRunOptions,
  VanillaImportRunSummary,
  VanillaImportStageName,
  VanillaMatchedMember,
  VanillaReadStateRow,
  VanillaReplyRow,
} from './vanilla-import.types';
import { VanillaChallengeLookupService } from './vanilla-challenge-lookup.service';
import {
  VanillaImportPreflightError,
  VanillaImportPreflightService,
} from './vanilla-import-preflight.service';
import { VanillaImportReportService } from './vanilla-import-report.service';
import { VanillaImportWriterService } from './vanilla-import-writer.service';
import { VanillaMemberMapperService } from './vanilla-member-mapper.service';
import { VanillaSourceReaderService } from './vanilla-source-reader.service';

interface ReplyParentTarget {
  parentType: 'TOPIC' | 'POST';
  parentId: string;
}

interface CollapsedReadState {
  sourceId: string;
  row: VanillaReadStateRow;
  topicId: string;
  member: VanillaMatchedMember;
}

const PROGRESS_LOG_INTERVAL = 500;

/**
 * Standalone Vanilla importer orchestration service.
 *
 * The service coordinates preflight, source reads, member/challenge mapping,
 * direct Prisma writes, and JSON reporting without bootstrapping the HTTP
 * `AppModule` or invoking runtime command/notification services.
 */
@Injectable()
export class VanillaImportService {
  private readonly logger = new Logger(VanillaImportService.name);
  private readonly importedTopicsByDiscussionId = new Map<
    string,
    ImportedTopicTarget
  >();
  private readonly readDiscussionIds: string[] = [];
  private readonly lastProgressUnitByStage = new Map<
    VanillaImportStageName,
    number
  >();

  /**
   * Creates the import orchestrator.
   *
   * @param preflightService Strict preflight gate.
   * @param sourceReader Vanilla MySQL source reader.
   * @param memberMapper Legacy actor mapper.
   * @param challengeLookup Challenge existence lookup.
   * @param writer Direct Prisma writer.
   * @param reportService JSON report accumulator.
   * @throws Does not throw directly; `run` surfaces stage failures.
   */
  constructor(
    private readonly preflightService: VanillaImportPreflightService,
    private readonly sourceReader: VanillaSourceReaderService,
    private readonly memberMapper: VanillaMemberMapperService,
    private readonly challengeLookup: VanillaChallengeLookupService,
    private readonly writer: VanillaImportWriterService,
    private readonly reportService: VanillaImportReportService,
  ) {}

  /**
   * Runs the full Vanilla import once.
   *
   * @param options CLI options including required report path and command.
   * @returns Final summary after writing the JSON report.
   * @throws Error when preflight fails or an unrecoverable orchestration error occurs.
   */
  async run(
    options: VanillaImportRunOptions,
  ): Promise<VanillaImportRunSummary> {
    this.importedTopicsByDiscussionId.clear();
    this.readDiscussionIds.length = 0;
    this.lastProgressUnitByStage.clear();
    this.reportService.start(options.command, options.reportPath);

    try {
      const preflight = await this.preflightService.run(options.reportPath);
      this.reportService.setPreflight(preflight);
      this.logger.log('Vanilla import preflight passed.');
    } catch (error) {
      await this.handlePreflightFailure(error);
      throw error;
    }

    try {
      await this.importTopics();
      await this.importReplies();
      await this.importWatches();
      await this.importReadStates();
      await this.importMemberBans();
      await this.importIpBans();

      const summary = await this.reportService.flush('completed');
      this.logSummary(summary);
      return summary;
    } catch (error) {
      const summary = await this.reportService.flush(
        'failed',
        this.summarizeError(error),
      );
      this.logSummary(summary);
      throw error;
    }
  }

  /**
   * Imports Vanilla discussions as root topics and starter posts.
   *
   * @returns A promise that resolves when all discussion rows are processed.
   * @throws Source reader errors when discussion reads fail.
   */
  private async importTopics(): Promise<void> {
    this.logStageStart('topics');

    for await (const discussion of this.sourceReader.readDiscussions()) {
      this.reportService.recordRead('topics');
      this.readDiscussionIds.push(discussion.discussionId);

      if (
        discussion.challengeId &&
        !(await this.challengeLookup.exists(discussion.challengeId))
      ) {
        this.reportService.recordSkipped('topics', {
          sourceId: discussion.discussionId,
          reason: 'missing_challenge',
          detail: { challengeId: discussion.challengeId },
        });
        this.logStageProgress('topics');
        continue;
      }

      const author = await this.memberMapper.mapActor(discussion.actor);
      this.reportService.recordMemberMapping(author);

      if (author.status === 'unmatched') {
        this.reportService.recordSkipped('topics', {
          sourceId: discussion.discussionId,
          reason: 'unmatched_discussion_author',
          detail: { legacyUserId: author.legacyUserId },
        });
        this.logStageProgress('topics');
        continue;
      }

      try {
        const target = await this.writer.importDiscussion(discussion, author);
        this.importedTopicsByDiscussionId.set(discussion.discussionId, target);
        this.reportService.recordImported('topics', {
          sourceId: discussion.discussionId,
          targetId: target.topicId,
          detail: { starterPostId: target.starterPostId },
        });
      } catch (error) {
        this.reportService.recordFailed('topics', {
          sourceId: discussion.discussionId,
          error: this.summarizeError(error),
        });
      }

      this.logStageProgress('topics');
    }

    this.logStageComplete('topics');
  }

  /**
   * Imports replies for imported discussions and skips unavailable branches.
   *
   * @returns A promise that resolves when all loaded reply rows are processed.
   * @throws Source reader errors when reply reads fail.
   */
  private async importReplies(): Promise<void> {
    const totalDiscussions = this.readDiscussionIds.length;
    this.logStageStart(
      'replies',
      `${totalDiscussions} source discussions to scan`,
    );

    let scannedDiscussions = 0;

    for (const discussionId of this.readDiscussionIds) {
      scannedDiscussions += 1;
      const replies =
        await this.sourceReader.readRepliesForDiscussion(discussionId);

      for (let index = 0; index < replies.length; index += 1) {
        this.reportService.recordRead('replies');
      }
      this.logStageProgress('replies');

      const topicTarget = this.importedTopicsByDiscussionId.get(discussionId);

      if (!topicTarget) {
        for (const reply of replies) {
          this.reportService.recordSkipped('replies', {
            sourceId: reply.replyId,
            reason: 'discussion_not_imported',
            detail: { discussionId },
          });
        }
        this.logStageProgress('replies');
        this.logReplyDiscussionProgress(scannedDiscussions, totalDiscussions);
        continue;
      }

      await this.importReplyGraph(replies, topicTarget);
      this.logStageProgress('replies');
      this.logReplyDiscussionProgress(scannedDiscussions, totalDiscussions);
    }

    this.logStageComplete(
      'replies',
      `${totalDiscussions} source discussions scanned`,
    );
  }

  /**
   * Imports one discussion's reply graph while preserving skipped descendants.
   *
   * @param replies Replies for one legacy discussion.
   * @param topicTarget Imported topic target for the discussion.
   * @returns A promise that resolves when the graph is processed.
   * @throws Does not throw for per-reply failures; they are reported.
   */
  private async importReplyGraph(
    replies: VanillaReplyRow[],
    topicTarget: ImportedTopicTarget,
  ): Promise<void> {
    const childrenByParentId = new Map<string | null, VanillaReplyRow[]>();
    const visitedReplyIds = new Set<string>();
    const importedPostIdsByReplyId = new Map<string, string>();

    for (const reply of replies) {
      const key = reply.parentReplyId ?? null;
      const children = childrenByParentId.get(key) ?? [];
      children.push(reply);
      childrenByParentId.set(key, children);
    }

    const importBranch = async (
      reply: VanillaReplyRow,
      parent: ReplyParentTarget,
    ): Promise<void> => {
      if (visitedReplyIds.has(reply.replyId)) {
        return;
      }

      visitedReplyIds.add(reply.replyId);
      const author = await this.memberMapper.mapActor(reply.actor);
      this.reportService.recordMemberMapping(author);

      if (author.status === 'unmatched') {
        this.skipReplyBranch(
          reply,
          childrenByParentId,
          visitedReplyIds,
          'unmatched_reply_author',
        );
        this.logStageProgress('replies');
        return;
      }

      try {
        const postId = await this.writer.importReply(
          reply,
          topicTarget.topicId,
          parent,
          author,
        );
        importedPostIdsByReplyId.set(reply.replyId, postId);
        this.reportService.recordImported('replies', {
          sourceId: reply.replyId,
          targetId: postId,
        });
        this.logStageProgress('replies');

        const children = childrenByParentId.get(reply.replyId) ?? [];

        for (const child of children) {
          await importBranch(child, {
            parentType: 'POST',
            parentId: postId,
          });
        }
      } catch (error) {
        this.reportService.recordFailed('replies', {
          sourceId: reply.replyId,
          error: this.summarizeError(error),
        });
        this.skipReplyChildren(
          reply,
          childrenByParentId,
          visitedReplyIds,
          'ancestor_reply_failed',
        );
        this.logStageProgress('replies');
      }
    };

    const directReplies = childrenByParentId.get(null) ?? [];

    for (const reply of directReplies) {
      await importBranch(reply, {
        parentType: 'TOPIC',
        parentId: topicTarget.topicId,
      });
    }

    for (const reply of replies) {
      if (!visitedReplyIds.has(reply.replyId)) {
        const parentPostId = reply.parentReplyId
          ? importedPostIdsByReplyId.get(reply.parentReplyId)
          : undefined;

        if (parentPostId) {
          await importBranch(reply, {
            parentType: 'POST',
            parentId: parentPostId,
          });
        } else {
          this.skipReplyBranch(
            reply,
            childrenByParentId,
            visitedReplyIds,
            'parent_reply_unavailable',
          );
          this.logStageProgress('replies');
        }
      }
    }
  }

  /**
   * Imports source watches after topic/member filtering and deduplication.
   *
   * @returns A promise that resolves when the watch stage is complete.
   * @throws Source reader errors when watch reads fail.
   */
  private async importWatches(): Promise<void> {
    this.logStageStart('watches');

    const importedKeys = new Set<string>();

    for await (const watch of this.sourceReader.readWatches()) {
      this.reportService.recordRead('watches');
      const topicTarget = this.importedTopicsByDiscussionId.get(
        watch.discussionId,
      );

      if (!topicTarget) {
        this.reportService.recordSkipped('watches', {
          sourceId: this.buildStateSourceId(
            watch.discussionId,
            watch.actor.legacyUserId,
          ),
          reason: 'discussion_not_imported',
        });
        this.logStageProgress('watches');
        continue;
      }

      const member = await this.memberMapper.mapActor(watch.actor);
      this.reportService.recordMemberMapping(member);

      if (member.status === 'unmatched') {
        this.reportService.recordSkipped('watches', {
          sourceId: this.buildStateSourceId(
            watch.discussionId,
            watch.actor.legacyUserId,
          ),
          reason: 'unmatched_watch_member',
        });
        this.logStageProgress('watches');
        continue;
      }

      const key = `${topicTarget.topicId}:${member.memberId}`;

      if (importedKeys.has(key)) {
        this.reportService.recordSkipped('watches', {
          sourceId: this.buildStateSourceId(
            watch.discussionId,
            watch.actor.legacyUserId,
          ),
          reason: 'duplicate_watch',
        });
        this.logStageProgress('watches');
        continue;
      }

      importedKeys.add(key);

      try {
        await this.writer.importWatch(watch, topicTarget.topicId, member);
        this.reportService.recordImported('watches', {
          sourceId: this.buildStateSourceId(
            watch.discussionId,
            watch.actor.legacyUserId,
          ),
          targetId: key,
        });
      } catch (error) {
        this.reportService.recordFailed('watches', {
          sourceId: this.buildStateSourceId(
            watch.discussionId,
            watch.actor.legacyUserId,
          ),
          error: this.summarizeError(error),
        });
      }

      this.logStageProgress('watches');
    }

    this.logStageComplete('watches');
  }

  /**
   * Imports read-state rows after collapsing duplicates to the latest read time.
   *
   * @returns A promise that resolves when the read-state stage is complete.
   * @throws Source reader errors when read-state reads fail.
   */
  private async importReadStates(): Promise<void> {
    this.logStageStart('readState');

    const collapsed = new Map<string, CollapsedReadState>();

    for await (const readState of this.sourceReader.readReadStates()) {
      this.reportService.recordRead('readState');
      const sourceId = this.buildStateSourceId(
        readState.discussionId,
        readState.actor.legacyUserId,
      );
      const topicTarget = this.importedTopicsByDiscussionId.get(
        readState.discussionId,
      );

      if (!topicTarget) {
        this.reportService.recordSkipped('readState', {
          sourceId,
          reason: 'discussion_not_imported',
        });
        this.logStageProgress('readState');
        continue;
      }

      const member = await this.memberMapper.mapActor(readState.actor);
      this.reportService.recordMemberMapping(member);

      if (member.status === 'unmatched') {
        this.reportService.recordSkipped('readState', {
          sourceId,
          reason: 'unmatched_read_state_member',
        });
        this.logStageProgress('readState');
        continue;
      }

      const key = `${topicTarget.topicId}:${member.memberId}`;
      const existing = collapsed.get(key);

      if (existing && existing.row.readAt >= readState.readAt) {
        this.reportService.recordSkipped('readState', {
          sourceId,
          reason: 'superseded_read_state',
          detail: { targetKey: key },
        });
        this.logStageProgress('readState');
        continue;
      }

      if (existing) {
        this.reportService.recordSkipped('readState', {
          sourceId: existing.sourceId,
          reason: 'superseded_read_state',
          detail: { targetKey: key },
        });
      }

      collapsed.set(key, {
        sourceId,
        row: readState,
        topicId: topicTarget.topicId,
        member,
      });
      this.logStageProgress('readState');
    }

    for (const [targetId, collapsedReadState] of collapsed) {
      try {
        await this.writer.importReadState(
          collapsedReadState.row,
          collapsedReadState.topicId,
          collapsedReadState.member,
        );
        this.reportService.recordImported('readState', {
          sourceId: collapsedReadState.sourceId,
          targetId,
        });
      } catch (error) {
        this.reportService.recordFailed('readState', {
          sourceId: collapsedReadState.sourceId,
          error: this.summarizeError(error),
        });
      }

      this.logStageProgress('readState');
    }

    this.logStageComplete('readState');
  }

  /**
   * Imports active member bans whose legacy users map to Topcoder members.
   *
   * @returns A promise that resolves when the member-ban stage is complete.
   * @throws Source reader errors when member-ban reads fail.
   */
  private async importMemberBans(): Promise<void> {
    this.logStageStart('memberBans');

    for await (const ban of this.sourceReader.readMemberBans()) {
      this.reportService.recordRead('memberBans');
      const member = await this.memberMapper.mapActor(ban.actor);
      this.reportService.recordMemberMapping(member);

      if (member.status === 'unmatched') {
        this.reportService.recordSkipped('memberBans', {
          sourceId: ban.banId,
          reason: 'unmatched_member_ban_member',
        });
        this.logStageProgress('memberBans');
        continue;
      }

      try {
        await this.writer.importMemberBan(ban, member);
        this.reportService.recordImported('memberBans', {
          sourceId: ban.banId,
          targetId: member.memberId,
        });
      } catch (error) {
        this.reportService.recordFailed('memberBans', {
          sourceId: ban.banId,
          error: this.summarizeError(error),
        });
      }

      this.logStageProgress('memberBans');
    }

    this.logStageComplete('memberBans');
  }

  /**
   * Imports exact IPv4/IPv6 host ban rows and skips unsupported rules.
   *
   * @returns A promise that resolves when the IP-ban stage is complete.
   * @throws Source reader errors when IP-ban reads fail.
   */
  private async importIpBans(): Promise<void> {
    this.logStageStart('ipBans');

    for await (const ban of this.sourceReader.readIpBans()) {
      this.reportService.recordRead('ipBans');

      try {
        const ipAddress = await this.writer.normalizeBareIpAddress(
          ban.ipAddress,
        );
        await this.writer.importIpBan(ipAddress, ban.createdAt);
        this.reportService.recordImported('ipBans', {
          sourceId: ban.banId,
          targetId: ipAddress,
        });
      } catch (error) {
        if (this.summarizeError(error) === 'unsupported_non_exact_ip_rule') {
          this.reportService.recordSkipped('ipBans', {
            sourceId: ban.banId,
            reason: 'unsupported_non_exact_ip_rule',
            detail: { ipAddress: ban.ipAddress },
          });
          this.logStageProgress('ipBans');
          continue;
        }

        this.reportService.recordFailed('ipBans', {
          sourceId: ban.banId,
          error: this.summarizeError(error),
        });
      }

      this.logStageProgress('ipBans');
    }

    this.logStageComplete('ipBans');
  }

  /**
   * Records preflight failures into the report and flushes when possible.
   *
   * @param error Preflight error or unexpected thrown value.
   * @returns A promise that resolves after best-effort report flushing.
   * @throws Does not throw; original errors are rethrown by `run`.
   */
  private async handlePreflightFailure(error: unknown): Promise<void> {
    if (error instanceof VanillaImportPreflightError) {
      this.reportService.setPreflight(error.preflight);
    }

    try {
      const summary = await this.reportService.flush(
        'failed',
        this.summarizeError(error),
      );
      this.logSummary(summary);
    } catch (flushError) {
      this.logger.error(
        `Failed to write Vanilla import report: ${this.summarizeError(flushError)}`,
      );
    }
  }

  /**
   * Skips one reply and all descendants because the whole branch is invalid.
   *
   * @param reply Root of the skipped branch.
   * @param childrenByParentId Reply adjacency map.
   * @param visitedReplyIds Mutable visited set.
   * @param reason Report reason for the branch root and descendants.
   * @returns Nothing.
   * @throws Does not throw.
   */
  private skipReplyBranch(
    reply: VanillaReplyRow,
    childrenByParentId: Map<string | null, VanillaReplyRow[]>,
    visitedReplyIds: Set<string>,
    reason: string,
  ): void {
    if (!visitedReplyIds.has(reply.replyId)) {
      visitedReplyIds.add(reply.replyId);
    }

    this.reportService.recordSkipped('replies', {
      sourceId: reply.replyId,
      reason,
    });
    this.skipReplyChildren(reply, childrenByParentId, visitedReplyIds, reason);
  }

  /**
   * Skips all descendants under a reply.
   *
   * @param reply Parent reply whose descendants should be skipped.
   * @param childrenByParentId Reply adjacency map.
   * @param visitedReplyIds Mutable visited set.
   * @param reason Report reason for descendants.
   * @returns Nothing.
   * @throws Does not throw.
   */
  private skipReplyChildren(
    reply: VanillaReplyRow,
    childrenByParentId: Map<string | null, VanillaReplyRow[]>,
    visitedReplyIds: Set<string>,
    reason: string,
  ): void {
    const children = childrenByParentId.get(reply.replyId) ?? [];

    for (const child of children) {
      if (visitedReplyIds.has(child.replyId)) {
        continue;
      }

      visitedReplyIds.add(child.replyId);
      this.reportService.recordSkipped('replies', {
        sourceId: child.replyId,
        reason,
        detail: { ancestorReplyId: reply.replyId },
      });
      this.skipReplyChildren(
        child,
        childrenByParentId,
        visitedReplyIds,
        reason,
      );
    }
  }

  /**
   * Builds a stable source id for user/discussion state rows.
   *
   * @param discussionId Legacy discussion id.
   * @param legacyUserId Legacy user id.
   * @returns Compact source id.
   * @throws Does not throw.
   */
  private buildStateSourceId(
    discussionId: string,
    legacyUserId: string,
  ): string {
    return `${discussionId}:${legacyUserId}`;
  }

  /**
   * Logs the beginning of an import stage with optional operator context.
   *
   * @param stage Stage that is starting.
   * @param detail Optional extra context such as source rows to scan.
   * @returns Nothing.
   * @throws Does not throw.
   */
  private logStageStart(stage: VanillaImportStageName, detail?: string): void {
    this.lastProgressUnitByStage.set(stage, 0);
    this.logger.log(
      `Starting Vanilla import stage "${stage}"${detail ? `: ${detail}` : ''}.`,
    );
  }

  /**
   * Logs stage progress when counters cross the configured interval.
   *
   * @param stage Stage whose report counters should be logged.
   * @returns Nothing.
   * @throws Error when the report has not been started.
   */
  private logStageProgress(stage: VanillaImportStageName): void {
    const summary = this.reportService.getStageSummary(stage);
    const completedRecords =
      summary.imported + summary.skipped + summary.failed;
    const progressUnit = Math.max(summary.read, completedRecords);
    const lastProgressUnit = this.lastProgressUnitByStage.get(stage) ?? 0;

    if (progressUnit - lastProgressUnit < PROGRESS_LOG_INTERVAL) {
      return;
    }

    const loggedProgressUnit =
      Math.floor(progressUnit / PROGRESS_LOG_INTERVAL) * PROGRESS_LOG_INTERVAL;
    this.lastProgressUnitByStage.set(stage, loggedProgressUnit);
    this.logger.log(
      `Vanilla import stage "${stage}" progress: ${this.formatStageSummary(
        stage,
      )}.`,
    );
  }

  /**
   * Logs the end of an import stage with the current report counters.
   *
   * @param stage Stage that completed.
   * @param detail Optional extra context such as source discussions scanned.
   * @returns Nothing.
   * @throws Error when the report has not been started.
   */
  private logStageComplete(
    stage: VanillaImportStageName,
    detail?: string,
  ): void {
    this.logger.log(
      `Completed Vanilla import stage "${stage}": ${this.formatStageSummary(
        stage,
      )}${detail ? ` (${detail})` : ''}.`,
    );
  }

  /**
   * Logs reply discussion scan progress because many scanned discussions have
   * no reply rows and therefore do not move the reply record counters.
   *
   * @param scannedDiscussions Number of source discussions already scanned.
   * @param totalDiscussions Total source discussions discovered from topics.
   * @returns Nothing.
   * @throws Error when the report has not been started.
   */
  private logReplyDiscussionProgress(
    scannedDiscussions: number,
    totalDiscussions: number,
  ): void {
    if (
      scannedDiscussions === 0 ||
      scannedDiscussions % PROGRESS_LOG_INTERVAL !== 0
    ) {
      return;
    }

    this.logger.log(
      `Vanilla import stage "replies" scanned ${scannedDiscussions}/${totalDiscussions} source discussions. ${this.formatStageSummary(
        'replies',
      )}.`,
    );
  }

  /**
   * Formats current report counters for compact progress logs.
   *
   * @param stage Stage whose counters should be formatted.
   * @returns Human-readable counter summary.
   * @throws Error when the report has not been started.
   */
  private formatStageSummary(stage: VanillaImportStageName): string {
    const summary = this.reportService.getStageSummary(stage);

    return `read=${summary.read}, imported=${summary.imported}, skipped=${summary.skipped}, failed=${summary.failed}`;
  }

  /**
   * Logs a compact CLI summary after report serialization.
   *
   * @param summary Import run summary.
   * @returns Nothing.
   * @throws Does not throw.
   */
  private logSummary(summary: VanillaImportRunSummary): void {
    this.logger.log(
      `Vanilla import ${summary.status}. Report: ${summary.reportPath}`,
    );
    this.logger.log(`Stage counts: ${JSON.stringify(summary.stages)}`);
  }

  /**
   * Converts unknown errors into compact report strings.
   *
   * @param error Unknown thrown value.
   * @returns Error message suitable for console and report output.
   * @throws Does not throw.
   */
  private summarizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }
}
