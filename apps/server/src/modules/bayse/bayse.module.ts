import { Module } from '@nestjs/common';
import { BayseService } from './bayse.service';
import { BayseController } from './bayse.controller';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  imports: [ConfigModule],
  controllers: [BayseController],
  providers: [BayseService,LoggerService],
  exports: [BayseService],
})
export class BayseModule {}
