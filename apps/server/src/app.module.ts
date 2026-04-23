import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { GeminiModule } from './modules/gemini/gemini.module';
import { BayseModule } from './modules/bayse/bayse.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { RiskModule } from './modules/risk/risk.module';
import { HttpMiddleware } from './common/middleware/http.middleware';
import { PrismaService } from './modules/prisma/prisma.service';
import { LoggerService } from './logger/logger.service';
import { JwtStrategy } from './common/utils/jwt-strategy.utils';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal:true,
    envFilePath: ".env"
  }),
  LoggerModule,
  PassportModule.register({
    defaultStrategy: 'jwt',
    session: false,
  }),
  JwtModule.registerAsync({
    global:true,
    inject:[ConfigService],
    useFactory:(configService:ConfigService)=> {
        const secret = configService.get<string>("JWT_SECRET")
        if(!secret){
          throw new Error("There is no Jwt Secret parsed in")
        };

        return {
          secret,
          signOptions:{
            expiresIn: "15d" as any
          }
        }

    },
  }),AuthModule,
  GeminiModule,
  BayseModule,
  PortfolioModule,
  RiskModule,
  
],
  
  controllers: [AppController],
  providers: [AppService, PrismaService, LoggerService, JwtStrategy],
  exports: [PassportModule, JwtStrategy],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
  consumer
  .apply(HttpMiddleware)
  .exclude('auth/(.*)', 'api-docs/(.*)')
  .forRoutes('*');
  }
}
