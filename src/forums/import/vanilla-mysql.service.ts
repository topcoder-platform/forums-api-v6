import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import type { Pool, RowDataPacket } from 'mysql2/promise';

/**
 * Lazy MySQL connection owner for importer-only Vanilla source access.
 *
 * The runtime forums API never injects this service. The import module uses it
 * to verify `VANILLA_DB_URL`, stream bounded source batches, and close the pool
 * when the standalone Nest application context shuts down.
 */
@Injectable()
export class VanillaMysqlService implements OnModuleDestroy {
  private pool?: Pool;

  /**
   * Creates the Vanilla MySQL adapter from Nest configuration.
   *
   * @param configService Configuration service containing `database.vanillaUrl`.
   * @throws Does not throw directly; missing configuration fails on first use.
   */
  constructor(private readonly configService: ConfigService) {}

  /**
   * Runs a lightweight connectivity query against the Vanilla database.
   *
   * @returns A promise that resolves when MySQL responds.
   * @throws Error when `VANILLA_DB_URL` is missing or the query fails.
   */
  async ping(): Promise<void> {
    await this.query<RowDataPacket[]>('SELECT 1 AS ok');
  }

  /**
   * Runs a parameterized SQL query against the Vanilla MySQL pool.
   *
   * @param sql SQL statement with MySQL placeholders.
   * @param values Placeholder values for the statement.
   * @returns Typed result rows from `mysql2/promise`.
   * @throws Error when configuration is missing or MySQL rejects the query.
   */
  async query<T extends RowDataPacket[]>(
    sql: string,
    values: readonly unknown[] = [],
  ): Promise<T> {
    const [rows] = await this.resolvePool().query<T>(sql, values);
    return rows;
  }

  /**
   * Closes the MySQL pool during module shutdown.
   *
   * @returns A promise that resolves when the pool is closed or was never used.
   * @throws MySQL pool shutdown errors.
   */
  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  /**
   * Lazily creates the importer-only Vanilla MySQL pool.
   *
   * @returns Configured MySQL pool.
   * @throws Error when `VANILLA_DB_URL` is not configured.
   */
  private resolvePool(): Pool {
    if (this.pool) {
      return this.pool;
    }

    const uri = this.configService.get<string>('database.vanillaUrl');

    if (!uri) {
      throw new Error('VANILLA_DB_URL must be configured for Vanilla import.');
    }

    this.pool = mysql.createPool({
      uri,
      connectionLimit: 4,
      namedPlaceholders: false,
    });

    return this.pool;
  }
}
