import { Module } from '@nestjs/common';
import { RiskService } from './risk.service';
import { RiskController } from './risk.controller';
import { PrismaService } from '../prisma/prisma.service';
import { BayseService } from '../bayse/bayse.service';
import { GeminiService } from '../gemini/gemini.service';

@Module({
  controllers: [RiskController],
  providers: [RiskService, PrismaService, BayseService, GeminiService],
  exports: [RiskService],
})
export class RiskModule {}
