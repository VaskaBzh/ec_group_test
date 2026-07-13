import { Module } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';

/**
 * Users domain module.
 *
 * Provides user persistence and lookup. Exports {@link UsersService} so the
 * `auth` module can register and authenticate users. Relies on the global
 * `PrismaModule` for database access.
 */
@Module({
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
