import { Module } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { BayseService } from '../bayse/bayse.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  controllers: [PortfolioController],
  providers: [PortfolioService,BayseService,PrismaService,LoggerService],
})
export class PortfolioModule {}
