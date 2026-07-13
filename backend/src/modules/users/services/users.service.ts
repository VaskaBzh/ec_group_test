import { Injectable, Logger } from '@nestjs/common';
import type { User } from '@prisma/client';
import {
  UsersRepository,
  type CreateUserData,
} from '../repositories/users.repository';

/**
 * Public user API consumed by the `auth` module.
 *
 * Thin orchestration layer over {@link UsersRepository}. Keeps user lookup and
 * creation behind a stable service boundary so other modules never depend on
 * Prisma or the repository directly.
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Look up a user by email.
   *
   * @returns The user, or `null` when no account uses that email.
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`[UsersService.findByEmail] email=${email}`);
    const user = await this.usersRepository.findByEmail(email);
    this.logger.debug(
      `[UsersService.findByEmail] result=${user ? 'found' : 'not found'}`,
    );
    return user;
  }

  /**
   * Look up a user by id.
   *
   * @returns The user, or `null` when the id is unknown.
   */
  async findById(id: string): Promise<User | null> {
    this.logger.debug(`[UsersService.findById] id=${id}`);
    const user = await this.usersRepository.findById(id);
    this.logger.debug(
      `[UsersService.findById] result=${user ? 'found' : 'not found'}`,
    );
    return user;
  }

  /**
   * Create a new user from an already-hashed password.
   *
   * @param data - Email, password hash and role.
   * @returns The created user.
   */
  async create(data: CreateUserData): Promise<User> {
    this.logger.debug(`[UsersService.create] email=${data.email} role=${data.role}`);
    const user = await this.usersRepository.create(data);
    this.logger.debug(`[UsersService.create] created id=${user.id}`);
    return user;
  }
}
