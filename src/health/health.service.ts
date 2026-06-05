import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { HealthCheckStatus, HealthResponseDto } from './health.dto';

/**
 * Service that performs DB-only health and readiness checks.
 *
 * This keeps operational checks separate from future forums domain logic and
 * mirrors the lightweight database readiness style used by existing v6 APIs.
 */
@Injectable()
export class HealthService {
  /**
   * Creates a health service instance.
   *
   * @param db Database service used to run the readiness query.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly db: DbService) {}

  /**
   * Runs the named health or readiness check.
   *
   * @param check Name of the route-level check being executed.
   * @returns A healthy response when the forums database answers `SELECT 1`.
   * @throws ServiceUnavailableException when the database check fails.
   */
  async check(check: 'health' | 'readiness'): Promise<HealthResponseDto> {
    const response = new HealthResponseDto();
    response.check = check;

    try {
      await this.db.ping();
      response.status = HealthCheckStatus.healthy;
      response.database = 'connected';
      return response;
    } catch (error) {
      response.status = HealthCheckStatus.unhealthy;
      response.database = 'disconnected';
      response.detail =
        error instanceof Error
          ? error.message
          : 'Failed to connect to database.';

      throw new ServiceUnavailableException(response);
    }
  }
}
