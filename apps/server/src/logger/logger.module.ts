import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './winston.config';

@Module({
  imports:[WinstonModule.forRoot(winstonConfig)],
  providers: [LoggerService],
})
export class LoggerModule {}
