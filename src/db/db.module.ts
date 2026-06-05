import { Global, Module } from '@nestjs/common';
import { DbService } from './db.service';

/**
 * Global database module for the forums service.
 *
 * The module exports the Prisma-backed database service so health checks and
 * forum command modules can share one generated client.
 */
@Global()
@Module({
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
