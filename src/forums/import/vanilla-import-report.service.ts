import { createHash } from 'crypto';
import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { mkdir, open, rm } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { createInterface } from 'readline';
import { Injectable } from '@nestjs/common';
import {
  VanillaFailedRecord,
  VanillaImportedRecord,
  VanillaImportReport,
  VanillaImportRunSummary,
  VanillaImportStageName,
  VanillaMemberMappingResult,
  VanillaPreflightReport,
  VanillaSkippedRecord,
  VanillaStageReport,
} from './vanilla-import.types';

const RECOVERY_MODEL =
  'No resume is supported. If imported results are unacceptable, wipe the target forums dataset and rerun the full import.';

const STAGE_NAMES: VanillaImportStageName[] = [
  'topics',
  'replies',
  'watches',
  'readState',
  'memberBans',
  'ipBans',
];

type ReportFileHandle = Awaited<ReturnType<typeof open>>;
type StageRecordFileName = keyof Pick<
  VanillaStageReport,
  'importedRecords' | 'skippedRecords' | 'failedRecords'
>;
type MemberMappingReportEntry =
  VanillaImportReport['memberMapping']['entries'][number];

interface VanillaStageReportState {
  read: number;
  imported: number;
  skipped: number;
  failed: number;
}

interface VanillaMemberMappingState {
  totalLegacyActors: number;
  matchedByHandle: number;
  matchedByEmail: number;
  unmatched: number;
}

interface VanillaImportReportState {
  metadata: VanillaImportReport['metadata'];
  preflight: VanillaPreflightReport | null;
  memberMapping: VanillaMemberMappingState;
  stages: Record<VanillaImportStageName, VanillaStageReportState>;
}

interface VanillaImportReportStaging {
  root: string;
  memberEntriesPath: string;
  memberSeenDir: string;
  stages: Record<VanillaImportStageName, Record<StageRecordFileName, string>>;
}

/**
 * JSON report accumulator and serializer for the Vanilla importer.
 *
 * The report keeps counters and summary metadata in memory while spilling
 * per-record details to temporary JSONL files. At the end of the run, the
 * service streams those staged records into the final structured JSON report
 * so production backfills do not retain every row in process memory.
 */
@Injectable()
export class VanillaImportReportService {
  private report?: VanillaImportReportState;
  private staging?: VanillaImportReportStaging;
  private startedAtMs = 0;

  /**
   * Initializes report metadata for one CLI run.
   *
   * @param command Full process command captured by the CLI.
   * @param reportPath Operator-selected JSON report path.
   * @returns Nothing.
   * @throws Does not throw.
   */
  start(command: string[], reportPath: string): void {
    this.cleanupStagingSync();

    const startedAt = new Date();
    this.startedAtMs = startedAt.getTime();
    this.report = {
      metadata: {
        startedAt: startedAt.toISOString(),
        completedAt: null,
        durationMs: null,
        command,
        reportPath,
        recoveryModel: RECOVERY_MODEL,
        status: 'running',
      },
      preflight: null,
      memberMapping: {
        totalLegacyActors: 0,
        matchedByHandle: 0,
        matchedByEmail: 0,
        unmatched: 0,
      },
      stages: {
        topics: this.createStageReport(),
        replies: this.createStageReport(),
        watches: this.createStageReport(),
        readState: this.createStageReport(),
        memberBans: this.createStageReport(),
        ipBans: this.createStageReport(),
      },
    };
  }

  /**
   * Records the completed preflight section.
   *
   * @param preflight Preflight results and dependency checks.
   * @returns Nothing.
   * @throws Error when the report has not been started.
   */
  setPreflight(preflight: VanillaPreflightReport): void {
    this.requireReport().preflight = preflight;
  }

  /**
   * Increments the read counter for an import stage.
   *
   * @param stage Stage receiving the source row.
   * @returns Nothing.
   * @throws Error when the report has not been started.
   */
  recordRead(stage: VanillaImportStageName): void {
    this.requireReport().stages[stage].read += 1;
  }

  /**
   * Records an imported source row.
   *
   * @param stage Stage that imported the row.
   * @param record Minimal source and target identifiers.
   * @returns Nothing.
   * @throws Error when the report has not been started or staging cannot be written.
   */
  recordImported(
    stage: VanillaImportStageName,
    record: VanillaImportedRecord,
  ): void {
    const stageReport = this.requireReport().stages[stage];
    stageReport.imported += 1;
    this.appendStageRecord(stage, 'importedRecords', record);
  }

  /**
   * Records a skipped source row.
   *
   * @param stage Stage that skipped the row.
   * @param record Source identifier, reason, and optional details.
   * @returns Nothing.
   * @throws Error when the report has not been started or staging cannot be written.
   */
  recordSkipped(
    stage: VanillaImportStageName,
    record: VanillaSkippedRecord,
  ): void {
    const stageReport = this.requireReport().stages[stage];
    stageReport.skipped += 1;
    this.appendStageRecord(stage, 'skippedRecords', record);
  }

  /**
   * Records a failed source row.
   *
   * @param stage Stage that failed the row.
   * @param record Source identifier, error summary, and optional details.
   * @returns Nothing.
   * @throws Error when the report has not been started or staging cannot be written.
   */
  recordFailed(
    stage: VanillaImportStageName,
    record: VanillaFailedRecord,
  ): void {
    const stageReport = this.requireReport().stages[stage];
    stageReport.failed += 1;
    this.appendStageRecord(stage, 'failedRecords', record);
  }

  /**
   * Records a unique legacy actor mapping result.
   *
   * @param result Mapping result returned by the member mapper.
   * @returns Nothing.
   * @throws Error when the report has not been started or staging cannot be written.
   */
  recordMemberMapping(result: VanillaMemberMappingResult): void {
    const staging = this.ensureStaging();
    const markerPath = join(
      staging.memberSeenDir,
      this.hashLegacyUserId(result.legacyUserId),
    );

    if (existsSync(markerPath)) {
      return;
    }

    writeFileSync(markerPath, '', 'utf8');

    const memberMapping = this.requireReport().memberMapping;
    memberMapping.totalLegacyActors += 1;

    if (result.status === 'matched') {
      if (result.matchedBy === 'handle') {
        memberMapping.matchedByHandle += 1;
      } else {
        memberMapping.matchedByEmail += 1;
      }

      this.appendJsonLine(staging.memberEntriesPath, {
        legacyUserId: result.legacyUserId,
        status: 'matched',
        matchedBy: result.matchedBy,
        memberId: result.memberId,
      });
      return;
    }

    memberMapping.unmatched += 1;
    this.appendJsonLine(staging.memberEntriesPath, {
      legacyUserId: result.legacyUserId,
      status: 'unmatched',
      reason: result.reason,
    });
  }

  /**
   * Reads the current counter-only summary for one import stage.
   *
   * @param stage Stage whose counters should be returned.
   * @returns Current read/imported/skipped/failed counters for progress logs.
   * @throws Error when the report has not been started.
   */
  getStageSummary(
    stage: VanillaImportStageName,
  ): Pick<VanillaStageReport, 'read' | 'imported' | 'skipped' | 'failed'> {
    const stageReport = this.requireReport().stages[stage];

    return {
      read: stageReport.read,
      imported: stageReport.imported,
      skipped: stageReport.skipped,
      failed: stageReport.failed,
    };
  }

  /**
   * Finalizes and writes the JSON report.
   *
   * @param status Final import status.
   * @param error Optional error summary for failed runs.
   * @returns Summary for CLI console output.
   * @throws File-system errors when writing the report fails.
   */
  async flush(
    status: 'completed' | 'failed',
    error?: string,
  ): Promise<VanillaImportRunSummary> {
    const report = this.requireReport();
    const completedAt = new Date();
    report.metadata.completedAt = completedAt.toISOString();
    report.metadata.durationMs = completedAt.getTime() - this.startedAtMs;
    report.metadata.status = status;

    if (error) {
      report.metadata.error = error;
    }

    await mkdir(dirname(report.metadata.reportPath), { recursive: true });
    await this.writeReportFile(report);
    await this.cleanupStaging();

    return {
      reportPath: report.metadata.reportPath,
      status,
      stages: Object.fromEntries(
        STAGE_NAMES.map((stage) => {
          const stageReport = report.stages[stage];
          return [
            stage,
            {
              read: stageReport.read,
              imported: stageReport.imported,
              skipped: stageReport.skipped,
              failed: stageReport.failed,
            },
          ];
        }),
      ) as VanillaImportRunSummary['stages'],
    };
  }

  /**
   * Creates an empty in-memory stage counter section.
   *
   * @returns Stage report counters with all counts set to zero.
   * @throws Does not throw.
   */
  private createStageReport(): VanillaStageReportState {
    return {
      read: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
    };
  }

  /**
   * Appends one staged stage record to the JSONL file for that stage/kind.
   *
   * @param stage Stage receiving the record.
   * @param fileName Record-array field that will contain the entry in the final report.
   * @param record Report entry to stage.
   * @returns Nothing.
   * @throws Error when the report has not been started or the staging file cannot be written.
   */
  private appendStageRecord(
    stage: VanillaImportStageName,
    fileName: StageRecordFileName,
    record: VanillaImportedRecord | VanillaSkippedRecord | VanillaFailedRecord,
  ): void {
    const staging = this.ensureStaging();
    this.appendJsonLine(staging.stages[stage][fileName], record);
  }

  /**
   * Appends one JSON object to a staged JSONL file.
   *
   * @param filePath Staging file path.
   * @param value JSON-serializable report entry.
   * @returns Nothing.
   * @throws File-system errors when appending fails.
   */
  private appendJsonLine(
    filePath: string,
    value:
      | VanillaImportedRecord
      | VanillaSkippedRecord
      | VanillaFailedRecord
      | MemberMappingReportEntry,
  ): void {
    appendFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf8');
  }

  /**
   * Creates the temporary staging directory and file map on first record write.
   *
   * @returns Active staging paths for report records and member mapping dedupe markers.
   * @throws File-system errors when the staging directory cannot be created.
   */
  private ensureStaging(): VanillaImportReportStaging {
    if (this.staging) {
      return this.staging;
    }

    const report = this.requireReport();
    const reportParent = dirname(resolve(report.metadata.reportPath));
    mkdirSync(reportParent, { recursive: true });

    const root = mkdtempSync(join(reportParent, '.vanilla-import-report-'));
    const memberSeenDir = join(root, 'member-seen');
    mkdirSync(memberSeenDir, { recursive: true });

    this.staging = {
      root,
      memberEntriesPath: join(root, 'member-mapping.entries.jsonl'),
      memberSeenDir,
      stages: Object.fromEntries(
        STAGE_NAMES.map((stage) => [
          stage,
          {
            importedRecords: join(root, `${stage}.imported.jsonl`),
            skippedRecords: join(root, `${stage}.skipped.jsonl`),
            failedRecords: join(root, `${stage}.failed.jsonl`),
          },
        ]),
      ) as VanillaImportReportStaging['stages'],
    };

    return this.staging;
  }

  /**
   * Hashes a legacy user id for a filesystem-safe dedupe marker filename.
   *
   * @param legacyUserId Legacy Vanilla user id.
   * @returns Hex SHA-256 marker filename.
   * @throws Does not throw.
   */
  private hashLegacyUserId(legacyUserId: string): string {
    return createHash('sha256').update(legacyUserId).digest('hex');
  }

  /**
   * Streams the final structured JSON report to the operator-selected path.
   *
   * @param report Counter-only report state plus metadata.
   * @returns A promise that resolves after the report file is written.
   * @throws File-system errors when the report cannot be written.
   */
  private async writeReportFile(
    report: VanillaImportReportState,
  ): Promise<void> {
    let reportFile: ReportFileHandle | undefined;

    try {
      reportFile = await open(report.metadata.reportPath, 'w');
      await this.writeChunk(reportFile, '{');
      await this.writeChunk(
        reportFile,
        `"metadata":${JSON.stringify(report.metadata)},`,
      );
      await this.writeChunk(
        reportFile,
        `"preflight":${JSON.stringify(report.preflight)},`,
      );
      await this.writeMemberMappingSection(reportFile, report.memberMapping);
      await this.writeChunk(reportFile, ',"stages":{');

      for (let index = 0; index < STAGE_NAMES.length; index += 1) {
        const stage = STAGE_NAMES[index];

        if (index > 0) {
          await this.writeChunk(reportFile, ',');
        }

        await this.writeStageSection(reportFile, stage, report.stages[stage]);
      }

      await this.writeChunk(reportFile, '}}\n');
    } finally {
      await reportFile?.close();
    }
  }

  /**
   * Streams the member-mapping summary and staged entries into the final report.
   *
   * @param reportFile Open final report file handle.
   * @param memberMapping Counter-only member mapping summary.
   * @returns A promise that resolves after the section is written.
   * @throws File-system errors when reading staged records or writing the report fails.
   */
  private async writeMemberMappingSection(
    reportFile: ReportFileHandle,
    memberMapping: VanillaMemberMappingState,
  ): Promise<void> {
    await this.writeChunk(
      reportFile,
      `"memberMapping":{"totalLegacyActors":${memberMapping.totalLegacyActors},"matchedByHandle":${memberMapping.matchedByHandle},"matchedByEmail":${memberMapping.matchedByEmail},"unmatched":${memberMapping.unmatched},"entries":`,
    );
    await this.writeJsonArrayFromJsonLines(
      reportFile,
      this.staging?.memberEntriesPath,
    );
    await this.writeChunk(reportFile, '}');
  }

  /**
   * Streams one stage counter section and its staged record arrays.
   *
   * @param reportFile Open final report file handle.
   * @param stage Stage name to write.
   * @param stageReport Counter-only stage state.
   * @returns A promise that resolves after the stage section is written.
   * @throws File-system errors when reading staged records or writing the report fails.
   */
  private async writeStageSection(
    reportFile: ReportFileHandle,
    stage: VanillaImportStageName,
    stageReport: VanillaStageReportState,
  ): Promise<void> {
    await this.writeChunk(
      reportFile,
      `"${stage}":{"read":${stageReport.read},"imported":${stageReport.imported},"skipped":${stageReport.skipped},"failed":${stageReport.failed},"importedRecords":`,
    );
    await this.writeJsonArrayFromJsonLines(
      reportFile,
      this.staging?.stages[stage].importedRecords,
    );
    await this.writeChunk(reportFile, ',"skippedRecords":');
    await this.writeJsonArrayFromJsonLines(
      reportFile,
      this.staging?.stages[stage].skippedRecords,
    );
    await this.writeChunk(reportFile, ',"failedRecords":');
    await this.writeJsonArrayFromJsonLines(
      reportFile,
      this.staging?.stages[stage].failedRecords,
    );
    await this.writeChunk(reportFile, '}');
  }

  /**
   * Streams a staged JSONL file as a JSON array.
   *
   * @param reportFile Open final report file handle.
   * @param filePath Optional staged JSONL file path.
   * @returns A promise that resolves after the array is written.
   * @throws File-system errors when reading staged records or writing the report fails.
   */
  private async writeJsonArrayFromJsonLines(
    reportFile: ReportFileHandle,
    filePath?: string,
  ): Promise<void> {
    await this.writeChunk(reportFile, '[');

    if (filePath && existsSync(filePath)) {
      const lines = createInterface({
        input: createReadStream(filePath, { encoding: 'utf8' }),
        crlfDelay: Infinity,
      });
      let first = true;

      for await (const line of lines) {
        if (!line) {
          continue;
        }

        await this.writeChunk(reportFile, first ? line : `,${line}`);
        first = false;
      }
    }

    await this.writeChunk(reportFile, ']');
  }

  /**
   * Writes one chunk to the final report file.
   *
   * @param reportFile Open final report file handle.
   * @param chunk Text chunk to write.
   * @returns A promise that resolves after the chunk has been accepted by the file handle.
   * @throws File-system errors when the write fails.
   */
  private async writeChunk(
    reportFile: ReportFileHandle,
    chunk: string,
  ): Promise<void> {
    await reportFile.write(chunk, null, 'utf8');
  }

  /**
   * Removes staged report artifacts after a successful flush.
   *
   * @returns A promise that resolves when cleanup completes.
   * @throws Does not throw; cleanup is best-effort.
   */
  private async cleanupStaging(): Promise<void> {
    const staging = this.staging;
    this.staging = undefined;

    if (!staging) {
      return;
    }

    await rm(staging.root, { recursive: true, force: true }).catch(
      () => undefined,
    );
  }

  /**
   * Removes staged report artifacts synchronously when starting a replacement run.
   *
   * @returns Nothing.
   * @throws Does not throw; cleanup is best-effort.
   */
  private cleanupStagingSync(): void {
    if (!this.staging) {
      return;
    }

    try {
      rmSync(this.staging.root, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup should not block a fresh import run.
    }

    this.staging = undefined;
  }

  /**
   * Returns the active report or fails when the run has not started.
   *
   * @returns Active report state.
   * @throws Error when `start` was not called.
   */
  private requireReport(): VanillaImportReportState {
    if (!this.report) {
      throw new Error('Vanilla import report has not been started.');
    }

    return this.report;
  }
}
