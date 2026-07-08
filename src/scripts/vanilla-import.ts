import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { VanillaImportModule } from '../forums/import/vanilla-import.module';
import { VanillaImportService } from '../forums/import/vanilla-import.service';

const logger = new Logger('VanillaImportCli');

/**
 * Parses the required `--report` CLI argument.
 *
 * @param argv Process arguments after the script path.
 * @returns Report path supplied by the operator.
 * @throws Error when `--report` is missing or empty.
 */
function parseReportPath(argv: string[]): string {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--report') {
      const value = argv[index + 1];

      if (value?.trim()) {
        return value.trim();
      }
    }

    if (arg.startsWith('--report=')) {
      const value = arg.slice('--report='.length).trim();

      if (value) {
        return value;
      }
    }
  }

  throw new Error(
    'Missing required --report argument. Usage: pnpm import:vanilla -- --report ./vanilla-import-report.json',
  );
}

/**
 * Bootstraps the isolated Nest application context and runs the importer.
 *
 * @returns A promise that resolves after import completion or process exit code setup.
 * @throws Does not throw to the process; failures set exit code 1.
 */
async function main(): Promise<void> {
  let app:
    | Awaited<ReturnType<typeof NestFactory.createApplicationContext>>
    | undefined;

  try {
    const reportPath = parseReportPath(process.argv.slice(2));
    app = await NestFactory.createApplicationContext(VanillaImportModule, {
      logger: ['error', 'warn', 'log'],
    });
    const service = app.get(VanillaImportService);

    await service.run({
      reportPath,
      command: process.argv,
    });
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await app?.close();
  }
}

void main();
