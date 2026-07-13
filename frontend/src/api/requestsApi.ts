import {
  CreateRequestInputSchema,
  ListRequestsQuerySchema,
  PaginatedPurchaseRequestsDtoSchema,
  PurchaseRequestDtoSchema,
} from '@ec-group/contracts';
import { httpClient } from './httpClient';
import type {
  CreateRequestInput,
  ListRequestsQuery,
  PaginatedResult,
  PurchaseRequestDto,
} from '@/types/request.types';

/**
 * Типизированный клиент эндпоинтов заявок (`/requests/*`).
 *
 * Использует общие Zod-контракты в обе стороны: исходящие payload'ы/query
 * валидируются перед отправкой (и получают дефолты сортировки/пагинации), а
 * ответы backend разбираются теми же схемами — так рассинхрон контракта
 * обнаруживается сразу на границе API, а не глубже в UI.
 */
export const requestsApi = {
  /**
   * Создать заявку на покупку (роль «заявитель»).
   *
   * @param input - Данные заявки (провалидируются `CreateRequestInputSchema`).
   * @returns Созданную заявку.
   */
  async create(input: CreateRequestInput): Promise<PurchaseRequestDto> {
    const payload = CreateRequestInputSchema.parse(input);
    const { data } = await httpClient.post('/requests', payload);
    return PurchaseRequestDtoSchema.parse(data);
  },

  /**
   * Получить страницу заявок с сортировкой и пагинацией (роль «проверяющий»).
   *
   * @param query - Частичные параметры списка; недостающие поля дополняются
   *   дефолтами схемы (`createdAt` desc, страница 1).
   * @returns Страницу заявок с метаданными пагинации.
   */
  async list(query: Partial<ListRequestsQuery> = {}): Promise<PaginatedResult<PurchaseRequestDto>> {
    const resolvedQuery = ListRequestsQuerySchema.parse(query);
    const { data } = await httpClient.get('/requests', { params: resolvedQuery });
    return PaginatedPurchaseRequestsDtoSchema.parse(data);
  },

  /**
   * Подтвердить заявку (роль «проверяющий»).
   *
   * @param requestId - Идентификатор заявки.
   * @returns Обновлённую заявку.
   */
  async approve(requestId: string): Promise<PurchaseRequestDto> {
    const { data } = await httpClient.patch(`/requests/${requestId}/approve`);
    return PurchaseRequestDtoSchema.parse(data);
  },

  /**
   * Отклонить заявку (роль «проверяющий»).
   *
   * @param requestId - Идентификатор заявки.
   * @returns Обновлённую заявку.
   */
  async reject(requestId: string): Promise<PurchaseRequestDto> {
    const { data } = await httpClient.patch(`/requests/${requestId}/reject`);
    return PurchaseRequestDtoSchema.parse(data);
  },
} as const;
