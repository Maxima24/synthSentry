import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal:true,
    envFilePath: ".env"
  }),
  LoggerModule,
  PassportModule.register({
    defaultStrategy: "jwt"
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
            expiresIn: "15m" as any
          }
        }

    },
  }),AuthModule
],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
