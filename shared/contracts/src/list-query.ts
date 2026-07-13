import { z } from 'zod';

/** Default page index applied when the query omits `page`. */
export const DEFAULT_PAGE = 1;

/** Default page size applied when the query omits `pageSize`. */
export const DEFAULT_PAGE_SIZE = 20;

/** Upper bound for `pageSize` to protect the backend from oversized pages. */
export const MAXIMUM_PAGE_SIZE = 100;

/**
 * Field the purchase request list can be sorted by.
 *
 * `author` sorts by the request author (resolved to a user column on the
 * backend), the rest map directly to purchase request columns.
 */
export const RequestSortFieldSchema = z.enum(['createdAt', 'status', 'amount', 'author']);

/** Allowed sort field literal, inferred from {@link RequestSortFieldSchema}. */
export type RequestSortField = z.infer<typeof RequestSortFieldSchema>;

/** Sort direction: ascending or descending. */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/** Sort direction literal, inferred from {@link SortDirectionSchema}. */
export type SortDirection = z.infer<typeof SortDirectionSchema>;

/**
 * Query parameters for listing purchase requests with sorting and pagination.
 *
 * `page` and `pageSize` use `z.coerce` because HTTP query strings deliver every
 * value as text — coercion turns `"2"` into `2` before the numeric checks run.
 * All fields are optional; sensible defaults are applied so a bare
 * `GET /requests` yields the first page ordered by newest first.
 */
export const ListRequestsQuerySchema = z.object({
  sortField: RequestSortFieldSchema.default('createdAt'),
  sortDirection: SortDirectionSchema.default('desc'),
  page: z.coerce
    .number({ invalid_type_error: 'page must be a number' })
    .int({ message: 'page must be a whole number' })
    .min(1, { message: 'page must be 1 or greater' })
    .default(DEFAULT_PAGE),
  pageSize: z.coerce
    .number({ invalid_type_error: 'pageSize must be a number' })
    .int({ message: 'pageSize must be a whole number' })
    .min(1, { message: 'pageSize must be 1 or greater' })
    .max(MAXIMUM_PAGE_SIZE, { message: `pageSize must be at most ${MAXIMUM_PAGE_SIZE}` })
    .default(DEFAULT_PAGE_SIZE),
});

/**
 * Parsed list query. The input accepts partial/absent fields (defaults fill the
 * gaps); the inferred type reflects the fully-resolved output where every field
 * is present.
 */
export type ListRequestsQuery = z.infer<typeof ListRequestsQuerySchema>;
