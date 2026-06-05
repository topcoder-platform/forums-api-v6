import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Health module for DB-only service checks.
 *
 * The module groups health/readiness controller behavior and shares the global
 * database module used by the rest of the service.
 */
@Module({
  imports: [DbModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
