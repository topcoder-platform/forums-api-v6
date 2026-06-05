import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './health.dto';
import { HealthService } from './health.service';

/**
 * Controller exposing DB-only health and readiness checks.
 *
 * The routes are mounted under the global `/v6/forums` prefix and intentionally
 * check only the forums database in Batch 1.
 */
@ApiTags('Health')
@Controller()
export class HealthController {
  /**
   * Creates a health controller instance.
   *
   * @param healthService Service that performs database checks.
   * @throws Does not throw directly; dependencies are resolved by Nest.
   */
  constructor(private readonly healthService: HealthService) {}

  /**
   * Checks whether the service dependencies are healthy.
   *
   * @returns A health response with database status.
   * @throws ServiceUnavailableException when the database check fails.
   */
  @Get('health')
  @ApiOperation({ summary: 'Check forums API health' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  @ApiResponse({ status: 503, description: 'Database is unavailable.' })
  health(): Promise<HealthResponseDto> {
    return this.healthService.check('health');
  }

  /**
   * Checks whether the service is ready to receive traffic.
   *
   * @returns A readiness response with database status.
   * @throws ServiceUnavailableException when the database check fails.
   */
  @Get('readiness')
  @ApiOperation({ summary: 'Check forums API readiness' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  @ApiResponse({ status: 503, description: 'Database is unavailable.' })
  readiness(): Promise<HealthResponseDto> {
    return this.healthService.check('readiness');
  }
}
