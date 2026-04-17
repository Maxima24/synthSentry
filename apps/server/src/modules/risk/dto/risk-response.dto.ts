import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskLevel } from './create-risk.dto';

export class RiskScoreDto {
  @ApiProperty({ example: 65 })
  overallScore!: number;

  @ApiProperty({ enum: RiskLevel, example: 'medium' })
  riskLevel!: RiskLevel;

  @ApiProperty({ example: 'Your portfolio shows moderate risk due to concentration in volatile crypto assets.' })
  explanation!: string;

  @ApiProperty({
    example: [
      'High concentration in BTC (60% of portfolio)',
      'Crypto assets show elevated volatility',
      'No diversification into traditional assets',
    ],
  })
  reasoningPath!: string[];

  @ApiProperty({ example: ['BTC: Unusual 12% price movement'] })
  anomalies!: string[];

  @ApiProperty()
  perAssetScores!: Array<{
    symbol: string;
    score: number;
    riskLevel: RiskLevel;
    riskFactors: string[];
  }>;

  @ApiProperty({ example: '2025-04-17T12:00:00Z' })
  evaluatedAt!: string;
}

export class RiskSnapshotDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 65 })
  overallScore!: number;

  @ApiProperty()
  explanation!: string;

  @ApiProperty()
  holdingScores!: Record<string, number>;

  @ApiProperty({ example: '2025-04-17T12:00:00Z' })
  snapShotAt!: string;
}

export class AlertTriggeredDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  alertId!: string;

  @ApiProperty({ example: 'BTC' })
  symbol!: string;

  @ApiProperty({ example: 75 })
  currentScore!: number;

  @ApiProperty({ example: 70 })
  threshold!: number;

  @ApiProperty({ example: 'Risk score exceeded threshold' })
  message!: string;

  @ApiProperty({ example: '2025-04-17T12:00:00Z' })
  triggeredAt!: string;
}

export class PortfolioRiskSummaryDto {
  @ApiProperty()
  portfolio!: {
    id: string;
    name: string;
    totalValue: number;
  };

  @ApiProperty()
  risk!: RiskScoreDto;

  @ApiProperty()
  alerts!: Array<{
    id: string;
    symbol: string;
    threshold: number;
    triggered: boolean;
  }>;

  @ApiProperty()
  activeAnomalies!: Array<{
    symbol: string;
    reason: string;
    severity: string;
  }>;
}