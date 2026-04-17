import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum TimeFrame {
  '1H' = '1h',
  '24H' = '24h',
  '7D' = '7d',
  '30D' = '30d',
}

export class GetAssetDto {
  @ApiProperty({ example: 'BTC', description: 'Asset symbol (e.g., BTC, AAPL)' })
  @IsString()
  symbol!: string;
}

export class GetAssetHistoryDto {
  @ApiProperty({ example: 'BTC', description: 'Asset symbol' })
  @IsString()
  symbol!: string;

  @ApiPropertyOptional({ enum: TimeFrame, example: '24h' })
  @IsOptional()
  @IsEnum(TimeFrame)
  timeframe?: TimeFrame;
}

export class SearchAssetsDto {
  @ApiProperty({ example: 'bitcoin', description: 'Search query' })
  @IsString()
  query!: string;
}

export class GetMultipleAssetsDto {
  @ApiProperty({ example: ['BTC', 'ETH'], description: 'Array of asset symbols' })
  @IsString({ each: true })
  symbols!: string[];
}