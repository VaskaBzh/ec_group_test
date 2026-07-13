import type { PurchaseRequestDto } from '@ec-group/contracts';
import { toUserDto } from '../../users/mappers/user.mapper';
import type { PurchaseRequestWithAuthor } from '../repositories/requests.repository';

/**
 * Map a persisted purchase request (with author) to its public DTO.
 *
 * Serializes the Prisma `Decimal` amount to a string so no monetary precision
 * is lost in transit, converts timestamps to ISO 8601 and embeds the public
 * author shape — matching the shared `PurchaseRequestDto` contract exactly.
 *
 * @param request - Request row including its eagerly-loaded author.
 * @returns The public purchase request DTO.
 */
export function toPurchaseRequestDto(
  request: PurchaseRequestWithAuthor,
): PurchaseRequestDto {
  return {
    id: request.id,
    title: request.title,
    quantity: request.quantity,
    amount: request.amount.toString(),
    comment: request.comment,
    status: request.status,
    author: toUserDto(request.author),
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}
