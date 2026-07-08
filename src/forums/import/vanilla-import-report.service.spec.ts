import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { VanillaImportReportService } from './vanilla-import-report.service';
import { VanillaImportReport } from './vanilla-import.types';

/**
 * Accesses the report service's private runtime state for memory-retention
 * assertions.
 *
 * @param service Report service under test.
 * @returns Internal report state object.
 * @throws Error when the service has not been started.
 */
function getInternalReportState(service: VanillaImportReportService) {
  const state = (
    service as unknown as {
      report?: {
        memberMapping: Record<string, unknown>;
        stages: Record<string, Record<string, unknown>>;
      };
    }
  ).report;

  if (!state) {
    throw new Error('Expected report service to be started.');
  }

  return state;
}

describe('VanillaImportReportService', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'vanilla-import-report-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('spills large per-record results while preserving the final report shape', async () => {
    const service = new VanillaImportReportService();
    const reportPath = join(tempDir, 'report.json');
    const recordCount = 1500;

    service.start(['cmd'], reportPath);

    for (let index = 0; index < recordCount; index += 1) {
      service.recordRead('topics');
      service.recordImported('topics', {
        sourceId: `discussion-${index}`,
        targetId: `topic-${index}`,
      });
      service.recordMemberMapping({
        status: 'matched',
        legacyUserId: `legacy-user-${index}`,
        memberId: `member-${index}`,
        handle: `handle-${index}`,
        matchedBy: index % 2 === 0 ? 'handle' : 'email',
      });
    }

    service.recordMemberMapping({
      status: 'matched',
      legacyUserId: 'legacy-user-1',
      memberId: 'member-1',
      handle: 'handle-1',
      matchedBy: 'handle',
    });

    const internalReport = getInternalReportState(service);
    expect(internalReport.memberMapping).not.toHaveProperty('entries');
    expect(internalReport.stages.topics).not.toHaveProperty('importedRecords');

    const summary = await service.flush('completed');
    const report = JSON.parse(
      await readFile(reportPath, 'utf8'),
    ) as VanillaImportReport;

    expect(summary.stages.topics).toEqual({
      read: recordCount,
      imported: recordCount,
      skipped: 0,
      failed: 0,
    });
    expect(report.memberMapping.totalLegacyActors).toBe(recordCount);
    expect(report.memberMapping.entries).toHaveLength(recordCount);
    expect(report.stages.topics.importedRecords).toHaveLength(recordCount);
    expect(report.stages.topics.importedRecords[1499]).toEqual({
      sourceId: 'discussion-1499',
      targetId: 'topic-1499',
    });
  });
});
