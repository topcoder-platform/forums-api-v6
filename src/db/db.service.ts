import {
  Injectable,
  INestApplication,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';

/**
 * Prisma-backed PostgreSQL connection service for the forums API.
 *
 * The service owns the generated forums Prisma client, configures the
 * PostgreSQL driver adapter, and exposes lightweight health helpers. Forum
 * command services inject this class to run transactional model operations.
 */
@Injectable()
export class DbService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Creates the Prisma client from configured environment values.
   *
   * @param configService Nest configuration service.
   * @throws Error when neither `FORUMS_DATABASE_URL` nor `DATABASE_URL` exists.
   */
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('database.url');

    if (!connectionString) {
      throw new Error(
        'FORUMS_DATABASE_URL or DATABASE_URL must be configured for forums-api-v6.',
      );
    }

    const adapter = new PrismaPg(
      { connectionString },
      { schema: DbService.resolveSchema(connectionString) },
    );

    super({ adapter });
  }

  /**
   * Opens the Prisma connection when the module starts.
   *
   * @returns A promise that resolves after Prisma connects.
   * @throws Prisma initialization or database connection errors.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Closes the Prisma connection when the module is destroyed.
   *
   * @returns A promise that resolves after Prisma disconnects.
   * @throws Prisma disconnection errors from the generated client.
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Runs a lightweight readiness query against the forums database.
   *
   * @returns A promise that resolves when the database responds.
   * @throws Prisma query or database connection errors.
   */
  async ping(): Promise<void> {
    await this.$queryRaw`SELECT 1`;
  }

  /**
   * Registers graceful shutdown behavior for the Nest application.
   *
   * @param app Nest application instance to close on process `beforeExit`.
   * @returns Nothing. The process event handler is registered for later use.
   * @throws Does not throw directly; `app.close()` failures are logged.
   */
  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      app.close().catch((error: unknown) => {
        console.error('Failed to close forums API cleanly', error);
      });
    });
  }

  /**
   * Resolves the PostgreSQL schema used by the Prisma driver adapter.
   *
   * @param connectionString Configured database connection URL.
   * @returns The URL `schema` parameter when supplied, otherwise `forums`.
   * @throws Does not throw; malformed URLs fall back to the dedicated schema.
   */
  private static resolveSchema(connectionString: string): string {
    try {
      return new URL(connectionString).searchParams.get('schema') ?? 'forums';
    } catch {
      return 'forums';
    }
  }
}
