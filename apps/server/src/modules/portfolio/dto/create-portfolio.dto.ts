// src/portfolio/dto/create-portfolio.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePortfolioDto {
  @ApiPropertyOptional({ example: 'My Investment Portfolio', description: 'Portfolio name', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}

// src/portfolio/dto/add-holding.dto.ts

