import { Injectable, Logger } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { UserRole } from '@ec-group/contracts';
import { PrismaService } from '../../../shared/prisma/prisma.service';

/** Data required to persist a new user row. */
export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: UserRole;
}

/**
 * Data-access layer for the `User` model.
 *
 * Encapsulates every Prisma query touching users so services never talk to the
 * ORM directly. Returns raw Prisma `User` rows (including `passwordHash`);
 * callers are responsible for stripping secrets before exposing data.
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a user by their unique email.
   *
   * @returns The user row, or `null` when no user has that email.
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`[UsersRepository.findByEmail] email=${email}`);
    const user = await this.prisma.user.findUnique({ where: { email } });
    this.logger.debug(`[UsersRepository.findByEmail] found=${user !== null}`);
    return user;
  }

  /**
   * Find a user by id.
   *
   * @returns The user row, or `null` when the id does not exist.
   */
  async findById(id: string): Promise<User | null> {
    this.logger.debug(`[UsersRepository.findById] id=${id}`);
    const user = await this.prisma.user.findUnique({ where: { id } });
    this.logger.debug(`[UsersRepository.findById] found=${user !== null}`);
    return user;
  }

  /**
   * Persist a new user.
   *
   * @param data - Email, pre-computed password hash and role.
   * @returns The created user row.
   * @throws Prisma unique-constraint error when the email already exists.
   */
  async create(data: CreateUserData): Promise<User> {
    this.logger.debug(`[UsersRepository.create] email=${data.email} role=${data.role}`);
    const user = await this.prisma.user.create({ data });
    this.logger.debug(`[UsersRepository.create] created id=${user.id}`);
    return user;
  }
}
