import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Legacy DTOs for backward compatibility
export class CreateRiskDto {}

export class UpdateRiskDto {}

export class CreateRiskAlertDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Holding ID' })
  @IsString()
  holdingId!: string;

  @ApiProperty({ example: 70, description: 'Threshold score (0-100)' })
  @IsNumber()
  @IsOptional()
  threshold?: number;
}

export class UpdateRiskAlertDto {
  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class EvaluateRiskDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Portfolio ID' })
  @IsString()
  portfolioId!: string;

  @ApiPropertyOptional({ description: 'Force re-evaluation even if cached' })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

export class GetRiskHistoryDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Portfolio ID' })
  @IsString()
  portfolioId!: string;

  @ApiPropertyOptional({ example: 10, description: 'Number of snapshots to return' })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class SetAlertThresholdDto {
  @ApiProperty({ example: 70, description: 'Risk score threshold (0-100)' })
  @IsNumber()
  threshold!: number;

  @ApiPropertyOptional({ example: 'Notify me when risk exceeds 70' })
  @IsOptional()
  @IsString()
  reason?: string;
}
