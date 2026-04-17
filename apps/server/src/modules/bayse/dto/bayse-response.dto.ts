import { ApiProperty } from '@nestjs/swagger';

export class BayseAssetResponseDto {
  @ApiProperty({ example: 'BTC' })
  symbol!: string;

  @ApiProperty({ example: 'Bitcoin' })
  name!: string;

  @ApiProperty({ example: 67500.50 })
  price!: number;

  @ApiProperty({ example: 2.5 })
  change24h!: number;

  @ApiProperty({ example: 1250000000 })
  volume!: number;

  @ApiProperty({ example: 1320000000000 })
  marketCap?: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'crypto' })
  type!: string;
}

export class BayseSearchResultDto {
  @ApiProperty({ example: 'BTC' })
  symbol!: string;

  @ApiProperty({ example: 'Bitcoin' })
  name!: string;

  @ApiProperty({ example: 'crypto' })
  type!: string;
}

export class BayseMarketTrendDto {
  @ApiProperty({ example: 'bitcoin' })
  symbol!: string;

  @ApiProperty({ example: 'Bitcoin' })
  name!: string;

  @ApiProperty({ example: 67500.50 })
  price!: number;

  @ApiProperty({ example: 2.5 })
  change24h!: number;

  @ApiProperty({ example: 'bullish' })
  trend!: 'bullish' | 'bearish' | 'neutral';

  @ApiProperty({ example: 0.8 })
  volatility!: number;
}

export class BaysePriceHistoryDto {
  @ApiProperty({ example: 'BTC' })
  symbol!: string;

  @ApiProperty({ example: '24h' })
  timeframe!: string;

  @ApiProperty({
    example: [
      { timestamp: '2025-04-17T10:00:00Z', price: 67400, volume: 125000 },
      { timestamp: '2025-04-17T11:00:00Z', price: 67500, volume: 130000 },
    ],
  })
  data!: Array<{
    timestamp: string;
    price: number;
    volume: number;
  }>;
}

export class BaysePortfolioPriceDto {
  @ApiProperty({ example: 'BTC' })
  symbol!: string;

  @ApiProperty({ example: 2.5 })
  quantity!: number;

  @ApiProperty({ example: 67500.50 })
  currentPrice!: number;

  @ApiProperty({ example: 168751.25 })
  currentValue!: number;

  @ApiProperty({ example: 2.5 })
  change24h!: number;

  @ApiProperty({ example: 4218.78 })
  change24hValue!: number;
}

export class BayseAnomalyDetectionDto {
  @ApiProperty({ example: 'BTC' })
  symbol!: string;

  @ApiProperty({ example: true })
  isAnomaly!: boolean;

  @ApiProperty({ example: 'Unusual price movement detected: 15% increase in last hour' })
  reason!: string;

  @ApiProperty({ example: 'high' })
  severity!: 'low' | 'medium' | 'high';

  @ApiProperty({ example: 15 })
  deviationPercent!: number;
}