import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BayseAsset {
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

  @ApiPropertyOptional({ example: 1320000000000 })
  marketCap?: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty({ example: 'crypto' })
  type!: string;
}

export class BaysePortfolioHolding {
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

export class BayseAnomaly {
  @ApiProperty({ example: 'BTC' })
  symbol!: string;

  @ApiProperty({ example: true })
  isAnomaly!: boolean;

  @ApiProperty({ example: 'Unusual price movement: 15% increase in 24h' })
  reason!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  severity!: 'low' | 'medium' | 'high';

  @ApiProperty({ example: 15 })
  deviationPercent!: number;
}
