import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { validateEnv } from './shared/config/env.validation';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RequestsModule } from './modules/requests/requests.module';

/**
 * Корневой модуль приложения.
 *
 * Подключает инфраструктурные модули — `ConfigModule` (валидация переменных
 * окружения через Zod на старте) и глобальный `PrismaModule` — и все доменные
 * модули: `users`, `auth`, `requests`.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RequestsModule,
  ],
})
export class AppModule {}
