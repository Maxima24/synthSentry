import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsUUID, Min } from 'class-validator';

export class AddHoldingDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Bayse event ID — use GET /portfolio/search to find valid event IDs',
  })
  @IsUUID()
  symbol!: string;

  @ApiProperty({
    enum: ['YES', 'NO'],
    example: 'YES',
    description: 'Side of the prediction market the user is paper-buying',
  })
  @IsIn(['YES', 'NO'])
  outcome!: 'YES' | 'NO';

  @ApiProperty({
    example: 50,
    description: 'Number of shares to add',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity!: number;
}