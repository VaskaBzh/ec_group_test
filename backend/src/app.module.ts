import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { validateEnv } from './shared/config/env.validation';

/**
 * Корневой модуль приложения.
 *
 * Подключает инфраструктурные модули: `ConfigModule` (валидация переменных
 * окружения через Zod на старте) и `PrismaModule` (доступ к БД). Доменные
 * модули (`auth`, `users`, `requests`) добавляются на этапе сборки приложения.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
  ],
})
export class AppModule {}
