import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    bufferLogs:true
  });
  app.enableCors({origin:"*"})
  const logger = app.get(LoggerService)
  app.useGlobalPipes( new ValidationPipe({
      whitelist:true,
      forbidNonWhitelisted:true,
      transform:true
  }))
  app.useGlobalFilters(new GlobalExceptionFilter(logger))
  app.getHttpAdapter().get("/",(req,res)=>{
    res.json({
      status:"ok"
    })
  })
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
