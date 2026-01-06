import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpAdapterHost } from '@nestjs/core';
import { DataSource } from 'typeorm';
import helmet from 'helmet';
import cors from 'cors';
import { AppModule } from './app.module';
import { createLogger } from './common/logger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { seedInitialData } from './database/seeds/initial-data.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.setGlobalPrefix('api/v1');
  // 환경 설정
  const appConfig = configService.get('app');
  const loggingConfig = configService.get('logging');

  // 로거 설정
  const logger = createLogger(loggingConfig.dir, loggingConfig.level);
  app.useLogger(logger);

  // 전역 예외 필터
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new HttpExceptionFilter(httpAdapterHost, logger));

  // 전역 인터셉터 (순서: 로깅 -> 응답 )
  app.useGlobalInterceptors(
    new LoggingInterceptor(logger),
    new ResponseInterceptor(),
  );

  // 전역 Validation 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // 보안 미들웨어
  app.use(helmet());
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'your-production-domain.com'
        : true,
    credentials: true,
  });

  // Swagger 설정
  if (appConfig.env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Sprint Log API')
      .setDescription('Sprint Log 백엔드 API')
      .setVersion('1.0')
      .addTag('health', '헬스 체크')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('sprint-api-docs', app, document);
  }

  // 초기 데이터 시드
  const dataSource = app.get(DataSource);
  if (dataSource && appConfig.env === 'development') {
    try {
      await seedInitialData(dataSource);
    } catch (error) {
      logger.error('초기 데이터 삽입 실패', error);
    }
  }

  await app.listen(appConfig.port, appConfig.host, () => {
    logger.info(`${appConfig.name} 서버 시작 - ${appConfig.env} mode`, {
      port: appConfig.port,
      host: appConfig.host,
    });
  });
}

bootstrap().catch((error) => {
  console.error('애플리케이션 시작 실패:', error);
  process.exit(1);
});
