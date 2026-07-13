/**
 * Public entry point for the shared contracts package.
 *
 * Re-exports every request/response Zod schema and its inferred TypeScript type
 * so both the NestJS backend (validation via `nestjs-zod`) and the Vue 3
 * frontend (typed API calls) import contracts from a single source of truth.
 *
 * Import from the package root only, never from individual files:
 *
 * ```ts
 * import { CreateRequestInputSchema, type PurchaseRequestDto } from '@ec-group/contracts';
 * ```
 */

// Enums shared across payloads and responses.
export { UserRoleSchema, RequestStatusSchema } from './enums';
export type { UserRole, RequestStatus } from './enums';

// Authentication input schemas.
export {
  RegisterInputSchema,
  LoginInputSchema,
  RefreshInputSchema,
  PASSWORD_MINIMUM_LENGTH,
} from './auth';
export type { RegisterInput, LoginInput, RefreshInput } from './auth';

// Purchase request input schema.
export {
  CreateRequestInputSchema,
  REQUEST_TITLE_MAXIMUM_LENGTH,
  REQUEST_COMMENT_MAXIMUM_LENGTH,
} from './requests';
export type { CreateRequestInput } from './requests';

// Response DTO schemas and the paginated-result wrapper.
export {
  UserDtoSchema,
  PurchaseRequestDtoSchema,
  AuthTokensDtoSchema,
  paginatedResultSchema,
  PaginatedPurchaseRequestsDtoSchema,
} from './dto';
export type {
  UserDto,
  PurchaseRequestDto,
  AuthTokensDto,
  PaginatedResult,
  PaginatedPurchaseRequestsDto,
} from './dto';

// List query schema for sorting and pagination.
export {
  ListRequestsQuerySchema,
  RequestSortFieldSchema,
  SortDirectionSchema,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAXIMUM_PAGE_SIZE,
} from './list-query';
export type {
  ListRequestsQuery,
  RequestSortField,
  SortDirection,
} from './list-query';
