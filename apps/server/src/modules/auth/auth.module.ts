import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService,PrismaService,LoggerService],
})
export class AuthModule {}
