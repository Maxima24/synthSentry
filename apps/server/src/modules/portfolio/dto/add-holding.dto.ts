import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class AddHoldingDto {
  @ApiProperty({ example: 'BTC', description: 'Asset symbol (e.g., BTC, ETH, AAPL)' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 2.5, description: 'Quantity of the asset', minimum: 0.000001 })
  @IsNumber()
  @Min(0.000001)
  quantity!: number;
}
