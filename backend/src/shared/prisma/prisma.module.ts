import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Глобальный модуль доступа к БД.
 *
 * Экспортирует единственный `PrismaService`, доступный всем доменным модулям
 * без повторного импорта (cross-cutting инфраструктура).
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
