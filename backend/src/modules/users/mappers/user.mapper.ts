import type { User } from '@prisma/client';
import type { UserDto } from '@ec-group/contracts';

/**
 * Map a Prisma `User` row to its public {@link UserDto} representation.
 *
 * Strips every secret (notably `passwordHash`) and serializes `createdAt` to an
 * ISO 8601 string so the output matches the shared contract exactly.
 *
 * @param user - Persisted user row.
 * @returns Public, secret-free user shape safe to return over the API.
 */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
