import { Module } from '@nestjs/common';
import { RequestsController } from './controllers/requests.controller';
import { RequestsService } from './services/requests.service';
import { RequestsRepository } from './repositories/requests.repository';

/**
 * Purchase requests domain module.
 *
 * Bundles the request controller, orchestration service and Prisma repository.
 * Authentication and role guards are applied at the controller level and rely
 * on the `auth` module's Passport strategy plus the global `PrismaModule`.
 */
@Module({
  controllers: [RequestsController],
  providers: [RequestsService, RequestsRepository],
})
export class RequestsModule {}
