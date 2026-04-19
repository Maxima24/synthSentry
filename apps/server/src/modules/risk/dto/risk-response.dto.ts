import { ApiProperty } from '@nestjs/swagger';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class PerAssetScoreDto {
  @ApiProperty({ description: 'Bayse event title (shortened)' })
  symbol!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  score!: number;

  @ApiProperty({ enum: RiskLevel })
  riskLevel!: RiskLevel;

  @ApiProperty({ type: [String] })
  riskFactors!: string[];
}

export class RiskScoreDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  overallScore!: number;

  @ApiProperty({ enum: RiskLevel })
  riskLevel!: RiskLevel;

  @ApiProperty()
  explanation!: string;

  @ApiProperty({ type: [String] })
  reasoningPath!: string[];

  @ApiProperty({ type: [String] })
  anomalies!: string[];

  @ApiProperty({ type: [PerAssetScoreDto] })
  perAssetScores!: PerAssetScoreDto[];

  @ApiProperty()
  evaluatedAt!: string;
}

export class RiskSnapshotDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  overallScore!: number;

  @ApiProperty({ enum: RiskLevel })
  riskLevel!: RiskLevel;

  @ApiProperty()
  explanation!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { 'Will BTC hit 100k?': 72, 'Super Eagles AFCON': 45 },
  })
  holdingScores!: Record<string, number>;

  @ApiProperty()
  snapShotAt!: string;
}

export class AlertTriggeredDto {
  @ApiProperty()
  alertId!: string;

  @ApiProperty({ description: 'Event title label (was symbol in stock version)' })
  label!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  currentScore!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  threshold!: number;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  triggeredAt!: string;
}

export class PortfolioSummaryFieldDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ description: 'Current total value of all open positions (USD)' })
  totalValue!: number;

  @ApiProperty({ description: 'Total amount invested across all positions (USD)' })
  totalCost!: number;

  @ApiProperty({ description: 'Overall portfolio gain/loss percentage' })
  totalPercentageChange!: number;

  @ApiProperty({ description: 'Available USD wallet balance on Bayse' })
  walletUsd!: number;

  @ApiProperty({ description: 'Available NGN wallet balance on Bayse' })
  walletNgn!: number;

  @ApiProperty({ description: 'Number of open prediction market positions' })
  openPositions!: number;
}

export class AlertSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Event/market label this alert is attached to' })
  label!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  threshold!: number;

  @ApiProperty()
  triggered!: boolean;

  @ApiProperty({ required: false, nullable: true })
  triggeredAt?: string;
}

export class AnomalySummaryDto {
  @ApiProperty({ description: 'Event/market label where anomaly was detected' })
  label!: string;

  @ApiProperty()
  reason!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  severity!: string;
}

export class PortfolioRiskSummaryDto {
  @ApiProperty({ type: PortfolioSummaryFieldDto })
  portfolio!: PortfolioSummaryFieldDto;

  @ApiProperty({ type: RiskScoreDto })
  risk!: RiskScoreDto;

  @ApiProperty({ type: [AlertSummaryDto] })
  alerts!: AlertSummaryDto[];

  @ApiProperty({ type: [AnomalySummaryDto] })
  activeAnomalies!: AnomalySummaryDto[];
}