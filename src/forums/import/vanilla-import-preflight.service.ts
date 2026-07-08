import { mkdir, open, stat, unlink } from 'fs/promises';
import { dirname, resolve } from 'path';
import { Injectable } from '@nestjs/common';
import { DbService } from '../../db/db.service';
import {
  VanillaPreflightCheckResult,
  VanillaPreflightReport,
  VanillaTargetCounts,
} from './vanilla-import.types';
import { VanillaChallengeLookupService } from './vanilla-challenge-lookup.service';
import { VanillaMemberMapperService } from './vanilla-member-mapper.service';
import { VanillaMysqlService } from './vanilla-mysql.service';

/**
 * Error raised when the importer preflight fails before source reads start.
 */
export class VanillaImportPreflightError extends Error {
  /**
   * Creates a preflight error with the report section that explains failures.
   *
   * @param preflight Preflight report section.
   * @param message Console-friendly failure summary.
   * @throws Does not throw.
   */
  constructor(
    readonly preflight: VanillaPreflightReport,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Strict preflight gate for the Vanilla importer.
 *
 * The importer only proceeds when the target forums dataset is empty, all
 * required databases are reachable, and the selected report path can be
 * written. Any failed check stops before the first legacy source read.
 */
@Injectable()
export class VanillaImportPreflightService {
  /**
   * Creates the preflight service.
   *
   * @param db Forums Prisma database service.
   * @param memberMapper Members database adapter used for connectivity checks.
   * @param challengeLookup Challenge database adapter used for connectivity checks.
   * @param mysqlService Vanilla MySQL adapter used for connectivity checks.
   * @throws Does not throw directly; checks raise errors during `run`.
   */
  constructor(
    private readonly db: DbService,
    private readonly memberMapper: VanillaMemberMapperService,
    private readonly challengeLookup: VanillaChallengeLookupService,
    private readonly mysqlService: VanillaMysqlService,
  ) {}

  /**
   * Runs all importer preflight checks and fails on any unsuccessful result.
   *
   * @param reportPath Operator-selected report path.
   * @returns Complete preflight report when all checks pass.
   * @throws VanillaImportPreflightError when any check fails.
   */
  async run(reportPath: string): Promise<VanillaPreflightReport> {
    const [forumsDb, targetCounts] = await this.checkForumsTarget();
    const [membersDb, challengeDb, vanillaDb, reportPathResult] =
      await Promise.all([
        this.checkDependency(() => this.memberMapper.ping()),
        this.checkDependency(() => this.challengeLookup.ping()),
        this.checkDependency(() => this.mysqlService.ping()),
        this.checkReportPath(reportPath),
      ]);
    const targetIsEmpty = this.isTargetEmpty(targetCounts);
    const preflight: VanillaPreflightReport = {
      ok:
        targetIsEmpty &&
        forumsDb.ok &&
        membersDb.ok &&
        challengeDb.ok &&
        vanillaDb.ok &&
        reportPathResult.ok,
      targetCounts,
      forumsDb,
      membersDb,
      challengeDb,
      vanillaDb,
      reportPath: reportPathResult,
    };

    if (!preflight.ok) {
      throw new VanillaImportPreflightError(
        preflight,
        this.buildFailureMessage(preflight),
      );
    }

    return preflight;
  }

  /**
   * Verifies forums DB connectivity and reads target table counts.
   *
   * @returns Connectivity result plus table counts.
   * @throws Does not throw; errors are captured in the check result.
   */
  private async checkForumsTarget(): Promise<
    [VanillaPreflightCheckResult, VanillaTargetCounts]
  > {
    const emptyCounts = this.emptyTargetCounts();

    try {
      await this.db.ping();
      const targetCounts = await this.readTargetCounts();
      return [{ ok: true }, targetCounts];
    } catch (error) {
      return [
        {
          ok: false,
          message: this.summarizeError(error),
        },
        emptyCounts,
      ];
    }
  }

  /**
   * Reads all target dataset counts that must be zero before importing.
   *
   * @returns Table counts for forum content, state, and bans.
   * @throws Prisma errors when count queries fail.
   */
  private async readTargetCounts(): Promise<VanillaTargetCounts> {
    const [
      topics,
      posts,
      topicClosures,
      topicWatches,
      topicReadStates,
      memberBans,
      ipBans,
    ] = await Promise.all([
      this.db.topic.count(),
      this.db.post.count(),
      this.db.topicClosure.count(),
      this.db.topicWatch.count(),
      this.db.topicReadState.count(),
      this.db.memberBan.count(),
      this.db.ipBan.count(),
    ]);

    return {
      topics,
      posts,
      topicClosures,
      topicWatches,
      topicReadStates,
      memberBans,
      ipBans,
    };
  }

  /**
   * Runs one dependency check and converts thrown errors to report values.
   *
   * @param check Async dependency check.
   * @returns Preflight check result.
   * @throws Does not throw; errors are captured.
   */
  private async checkDependency(
    check: () => Promise<void>,
  ): Promise<VanillaPreflightCheckResult> {
    try {
      await check();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: this.summarizeError(error),
      };
    }
  }

  /**
   * Validates that the report path can be written before the import starts.
   *
   * @param reportPath Operator-selected report path.
   * @returns Report path check result.
   * @throws Does not throw; file-system errors are captured.
   */
  private async checkReportPath(
    reportPath: string,
  ): Promise<VanillaPreflightCheckResult> {
    let removeCreatedReport = false;
    let reportHandle: Awaited<ReturnType<typeof open>> | undefined;

    try {
      const resolvedReportPath = resolve(reportPath);
      const parent = dirname(resolvedReportPath);

      await mkdir(parent, { recursive: true });

      const existing = await stat(resolvedReportPath).catch(() => undefined);

      if (existing?.isDirectory()) {
        return {
          ok: false,
          message: 'Report path points to a directory.',
        };
      }

      removeCreatedReport = !existing;
      reportHandle = await open(resolvedReportPath, 'w');

      await reportHandle.close();
      reportHandle = undefined;

      if (removeCreatedReport) {
        await unlink(resolvedReportPath);
        removeCreatedReport = false;
      }

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: this.summarizeError(error),
      };
    } finally {
      if (reportHandle) {
        await reportHandle.close().catch(() => undefined);
      }

      if (removeCreatedReport) {
        await unlink(resolve(reportPath)).catch(() => undefined);
      }
    }
  }

  /**
   * Creates an all-zero count object for unreachable forums DB checks.
   *
   * @returns Zeroed target table counts.
   * @throws Does not throw.
   */
  private emptyTargetCounts(): VanillaTargetCounts {
    return {
      topics: 0,
      posts: 0,
      topicClosures: 0,
      topicWatches: 0,
      topicReadStates: 0,
      memberBans: 0,
      ipBans: 0,
    };
  }

  /**
   * Determines whether all target tables are empty.
   *
   * @param targetCounts Target table counts.
   * @returns True when every count is zero.
   * @throws Does not throw.
   */
  private isTargetEmpty(targetCounts: VanillaTargetCounts): boolean {
    return Object.values(targetCounts).every((count) => count === 0);
  }

  /**
   * Builds a concise preflight failure message for console output.
   *
   * @param preflight Failed preflight report.
   * @returns Human-readable failure summary including target counts.
   * @throws Does not throw.
   */
  private buildFailureMessage(preflight: VanillaPreflightReport): string {
    const checks: Array<[string, VanillaPreflightCheckResult]> = [
      ['forumsDb', preflight.forumsDb],
      ['membersDb', preflight.membersDb],
      ['challengeDb', preflight.challengeDb],
      ['vanillaDb', preflight.vanillaDb],
      ['reportPath', preflight.reportPath],
    ];
    const failedChecks = checks
      .filter(([, result]) => !result.ok)
      .map(([name, result]) => `${name}: ${result.message ?? 'failed'}`);

    if (!this.isTargetEmpty(preflight.targetCounts)) {
      failedChecks.unshift(
        `target dataset is not empty: ${JSON.stringify(preflight.targetCounts)}`,
      );
    }

    return `Vanilla import preflight failed. ${failedChecks.join('; ')}`;
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
