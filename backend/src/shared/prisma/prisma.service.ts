import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Обёртка над `PrismaClient`, управляющая жизненным циклом подключения к БД
 * в рамках DI-контейнера NestJS.
 *
 * Подключение открывается при инициализации модуля и корректно закрывается
 * при остановке приложения. Инжектируется в репозитории доменных модулей.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /** Открывает подключение к базе данных при старте модуля. */
  async onModuleInit(): Promise<void> {
    this.logger.debug('[PrismaService] connecting to database');
    try {
      await this.$connect();
      this.logger.log('[PrismaService] connected');
    } catch (error) {
      this.logger.error(
        '[PrismaService] failed to connect to database',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /** Закрывает подключение при остановке приложения. */
  async onModuleDestroy(): Promise<void> {
    this.logger.debug('[PrismaService] disconnecting from database');
    await this.$disconnect();
    this.logger.log('[PrismaService] disconnected');
  }
}
