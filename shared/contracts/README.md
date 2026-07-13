# @ec-group/contracts

Shared [Zod](https://zod.dev) schemas and inferred TypeScript types for the
purchase-request API. A single source of truth for request/response shapes,
consumed by both the NestJS backend and the Vue 3 frontend.

## Structure

```text
shared/contracts/
├── package.json          # Package manifest (name @ec-group/contracts, zod dependency)
├── tsconfig.json         # Emits dist/ with type declarations
└── src/
    ├── enums.ts          # UserRoleSchema, RequestStatusSchema (+ types)
    ├── auth.ts           # RegisterInputSchema, LoginInputSchema (+ types)
    ├── requests.ts       # CreateRequestInputSchema (+ type)
    ├── dto.ts            # UserDto, PurchaseRequestDto, AuthTokensDto, PaginatedResult<T>
    ├── list-query.ts     # ListRequestsQuerySchema (sorting + pagination)
    └── index.ts          # Public API — re-exports every schema and type
```

Always import from the package root, never from individual files:

```ts
import {
  CreateRequestInputSchema,
  ListRequestsQuerySchema,
  type PurchaseRequestDto,
  type PaginatedResult,
} from '@ec-group/contracts';
```

## Schemas and types

| Schema | Inferred type | Purpose |
|--------|---------------|---------|
| `UserRoleSchema` | `UserRole` | `Requester` \| `Reviewer` (mirrors Prisma enum) |
| `RequestStatusSchema` | `RequestStatus` | `Pending` \| `Approved` \| `Rejected` |
| `RegisterInputSchema` | `RegisterInput` | Registration payload (email, strong password, role) |
| `LoginInputSchema` | `LoginInput` | Login payload (email, password) |
| `CreateRequestInputSchema` | `CreateRequestInput` | New purchase request (title, quantity, amount, comment?) |
| `UserDtoSchema` | `UserDto` | Public user (no secrets) |
| `PurchaseRequestDtoSchema` | `PurchaseRequestDto` | Public purchase request with embedded author |
| `AuthTokensDtoSchema` | `AuthTokensDto` | Issued JWT bundle (access + optional refresh) |
| `paginatedResultSchema(item)` | `PaginatedResult<T>` | Generic `{ items, total, page, pageSize }` wrapper |
| `ListRequestsQuerySchema` | `ListRequestsQuery` | List sorting + pagination query |

`PaginatedPurchaseRequestsDtoSchema` is the ready-made paginated schema for
`PurchaseRequestDto`.

## Usage in the backend (NestJS + nestjs-zod)

Wrap a schema in a DTO class and validate it with the global `ZodValidationPipe`:

```ts
import { createZodDto } from 'nestjs-zod';
import { CreateRequestInputSchema, ListRequestsQuerySchema } from '@ec-group/contracts';

export class CreateRequestDto extends createZodDto(CreateRequestInputSchema) {}
export class ListRequestsQueryDto extends createZodDto(ListRequestsQuerySchema) {}

@Controller('requests')
export class RequestsController {
  @Post()
  create(@Body() body: CreateRequestDto) { /* body is validated + typed */ }

  @Get()
  list(@Query() query: ListRequestsQueryDto) { /* page/pageSize coerced from strings */ }
}
```

Response DTO schemas double as the contract the controller returns
(`Promise<PaginatedPurchaseRequestsDto>`), keeping backend output aligned with
what the frontend expects.

> `PurchaseRequestDto.amount` is a **decimal string** — serialize the Prisma
> `Decimal` column directly so no monetary precision is lost.

## Usage in the frontend (Vue 3 + TypeScript)

Type API clients with the inferred types and validate responses at the edge:

```ts
import {
  ListRequestsQuerySchema,
  PaginatedPurchaseRequestsDtoSchema,
  type CreateRequestInput,
  type PaginatedPurchaseRequestsDto,
} from '@ec-group/contracts';

export async function fetchRequests(
  query: Partial<ListRequestsQuery>,
): Promise<PaginatedPurchaseRequestsDto> {
  const params = ListRequestsQuerySchema.parse(query); // fills defaults
  const response = await httpClient.get('/requests', { params });
  return PaginatedPurchaseRequestsDtoSchema.parse(response.data);
}

export function createRequest(input: CreateRequestInput) {
  const payload = CreateRequestInputSchema.parse(input); // validate before sending
  return httpClient.post('/requests', payload);
}
```

## Build

```bash
npm install       # inside shared/contracts
npm run build     # emits dist/ (JS + .d.ts)
npm run typecheck # type-check without emitting
```

Wire the package into `backend/` and `frontend/` as a workspace dependency (or a
`file:../shared/contracts` reference) so both resolve `@ec-group/contracts`.
