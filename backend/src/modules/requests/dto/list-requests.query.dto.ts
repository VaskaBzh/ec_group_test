import { createZodDto } from 'nestjs-zod';
import { ListRequestsQuerySchema } from '@ec-group/contracts';

/**
 * Query parameters for the paginated, sortable request list.
 *
 * Backed by the shared `ListRequestsQuerySchema`, which coerces `page`/`pageSize`
 * from their string query-string form and applies sensible defaults.
 */
export class ListRequestsQueryDto extends createZodDto(ListRequestsQuerySchema) {}
