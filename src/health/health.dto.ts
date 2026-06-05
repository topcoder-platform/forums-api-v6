import { ApiProperty } from '@nestjs/swagger';

export enum HealthCheckStatus {
  healthy = 'healthy',
  unhealthy = 'unhealthy',
}

/**
 * API response DTO for health and readiness routes.
 *
 * The DTO communicates service status and the single Batch 1 dependency:
 * database connectivity.
 */
export class HealthResponseDto {
  @ApiProperty({
    description: 'Overall health check status.',
    enum: HealthCheckStatus,
    example: HealthCheckStatus.healthy,
  })
  status: HealthCheckStatus;

  @ApiProperty({
    description: 'Name of the check that produced this response.',
    example: 'readiness',
  })
  check: string;

  @ApiProperty({
    description: 'Forums database connectivity status.',
    example: 'connected',
  })
  database: string;

  @ApiProperty({
    description: 'Additional failure detail when the check is unhealthy.',
    required: false,
    example: 'Failed to connect to database.',
  })
  detail?: string;
}
