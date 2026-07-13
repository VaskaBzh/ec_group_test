import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { resolveEnabledLogLevels } from './shared/config/log-levels';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import type { Env } from './shared/config/env.validation';

/**
 * Точка входа backend-приложения.
 *
 * Поднимает NestJS-приложение с уровнем логирования из `LOG_LEVEL`, включает
 * глобальную Zod-валидацию входных DTO, единый фильтр ошибок и CORS, слушает
 * порт из конфигурации (по умолчанию 3000) и логирует старт на INFO.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: resolveEnabledLogLevels(process.env.LOG_LEVEL),
  });

  const configService = app.get(ConfigService<Env, true>);

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const corsOrigin = configService.get('CORS_ORIGIN', { infer: true });
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  });

  const port = configService.get('PORT', { infer: true });
  await app.listen(port);

  Logger.log(`[Bootstrap] app started on port ${port}`, 'Bootstrap');
}

void bootstrap();
