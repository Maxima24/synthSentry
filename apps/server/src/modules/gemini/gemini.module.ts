import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { GeminiController } from './gemini.controller';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { PortfolioService } from '../portfolio/portfolio.service';
import { PrismaService } from '../prisma/prisma.service';
import { BayseService } from '../bayse/bayse.service';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  imports:[PortfolioModule],
  controllers: [GeminiController],
  providers: [GeminiService,PortfolioService,PrismaService,BayseService,LoggerService],
})
export class GeminiModule {}
