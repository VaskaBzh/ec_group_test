import { z } from 'zod';
import { UserRoleSchema, RequestStatusSchema } from './enums';

/**
 * ISO 8601 datetime string (for example `2026-07-13T10:15:30.000Z`).
 *
 * Timestamps cross the API as strings because JSON has no native date type;
 * consumers parse them into `Date` at the edge if needed.
 */
const isoDateTimeSchema = z.string().datetime();

/**
 * Public representation of a user.
 *
 * Never contains the password hash or any other secret — only fields that are
 * safe to expose to the client.
 */
export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  createdAt: isoDateTimeSchema,
});

/** Public user shape, inferred from {@link UserDtoSchema}. */
export type UserDto = z.infer<typeof UserDtoSchema>;

/**
 * Public representation of a purchase request.
 *
 * `amount` is a decimal string rather than a number: it is serialized directly
 * from the Prisma `Decimal` column so no monetary precision is lost in transit.
 * The embedded `author` lets the reviewer list render and sort by author
 * without an extra lookup.
 */
export const PurchaseRequestDtoSchema = z.object({
  id: z.string(),
  title: z.string(),
  quantity: z.number().int(),
  amount: z.string(),
  comment: z.string().nullable(),
  status: RequestStatusSchema,
  author: UserDtoSchema,
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

/** Public purchase request shape, inferred from {@link PurchaseRequestDtoSchema}. */
export type PurchaseRequestDto = z.infer<typeof PurchaseRequestDtoSchema>;

/**
 * JWT bundle issued on successful authentication.
 *
 * `refreshToken` is optional so the backend can operate with an access token
 * only, or add refresh-token rotation later without changing the contract.
 */
export const AuthTokensDtoSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});

/** Issued token bundle, inferred from {@link AuthTokensDtoSchema}. */
export type AuthTokensDto = z.infer<typeof AuthTokensDtoSchema>;

/**
 * Build a paginated-result schema wrapping any item schema.
 *
 * @param itemSchema - Schema describing a single item in the `items` array.
 * @returns An object schema with `items`, `total`, `page` and `pageSize`.
 *
 * @example
 * ```ts
 * const paginatedRequests = paginatedResultSchema(PurchaseRequestDtoSchema);
 * type Page = z.infer<typeof paginatedRequests>; // PaginatedResult<PurchaseRequestDto>
 * ```
 */
export function paginatedResultSchema<ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) {
  return z.object({
    /** Items on the current page. */
    items: z.array(itemSchema),
    /** Total number of items across all pages. */
    total: z.number().int().nonnegative(),
    /** 1-based index of the current page. */
    page: z.number().int().positive(),
    /** Number of items requested per page. */
    pageSize: z.number().int().positive(),
  });
}

/**
 * Generic paginated response envelope.
 *
 * The type is expressed independently of any specific item schema so consumers
 * can write `PaginatedResult<PurchaseRequestDto>` directly.
 */
export interface PaginatedResult<Item> {
  /** Items on the current page. */
  items: Item[];
  /** Total number of items across all pages. */
  total: number;
  /** 1-based index of the current page. */
  page: number;
  /** Number of items requested per page. */
  pageSize: number;
}

/** Concrete paginated schema for purchase requests, ready to use on both sides. */
export const PaginatedPurchaseRequestsDtoSchema = paginatedResultSchema(PurchaseRequestDtoSchema);

/** Paginated purchase requests page, inferred from {@link PaginatedPurchaseRequestsDtoSchema}. */
export type PaginatedPurchaseRequestsDto = z.infer<typeof PaginatedPurchaseRequestsDtoSchema>;
