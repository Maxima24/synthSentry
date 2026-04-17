import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerService } from 'src/logger/logger.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/common/utils/jwt-strategy.utils';

@Module({
  controllers: [AuthController],
  providers: [AuthService,PrismaService,LoggerService,JwtStrategy,PassportModule],
  exports:[PassportModule]
})
export class AuthModule {}
