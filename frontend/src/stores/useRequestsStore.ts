import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@ec-group/contracts';
import { requestsApi } from '@/api/requestsApi';
import { extractApiErrorMessage } from '@/api/httpClient';
import { logger } from '@/shared/logger';
import type {
  CreateRequestInput,
  PurchaseRequestDto,
  RequestSortField,
  SortDirection,
} from '@/types/request.types';

/** Поле сортировки по умолчанию (совпадает с дефолтом контракта списка). */
const DEFAULT_SORT_FIELD: RequestSortField = 'createdAt';

/** Направление сортировки по умолчанию (новые заявки сверху). */
const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

/**
 * Стор списка заявок: состояние и бизнес-логика экрана проверки.
 *
 * Владеет данными таблицы (заявки, метаданные пагинации), текущей сортировкой и
 * страницей, а также флагом загрузки для skeleton-состояния. Все обращения к
 * сети идут через `requestsApi`; компоненты вызывают действия стора и не ходят
 * в API напрямую.
 */
export const useRequestsStore = defineStore('requests', () => {
  /** Заявки текущей страницы. */
  const items = ref<PurchaseRequestDto[]>([]);

  /** Общее число заявок по всем страницам (для расчёта пагинации). */
  const total = ref<number>(0);

  /** Текущая (1-based) страница. */
  const page = ref<number>(DEFAULT_PAGE);

  /** Размер страницы. */
  const pageSize = ref<number>(DEFAULT_PAGE_SIZE);

  /** Текущее поле сортировки. */
  const sortField = ref<RequestSortField>(DEFAULT_SORT_FIELD);

  /** Текущее направление сортировки. */
  const sortDirection = ref<SortDirection>(DEFAULT_SORT_DIRECTION);

  /** Идёт ли загрузка списка (для показа skeleton). */
  const isLoading = ref<boolean>(false);

  /** Сообщение последней ошибки загрузки/действия (или `null`). */
  const errorMessage = ref<string | null>(null);

  /** Общее число страниц при текущем размере страницы (минимум 1). */
  const totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(total.value / pageSize.value)),
  );

  /** Есть ли следующая страница. */
  const hasNextPage = computed<boolean>(() => page.value < totalPages.value);

  /** Есть ли предыдущая страница. */
  const hasPreviousPage = computed<boolean>(() => page.value > 1);

  /**
   * Загрузить текущую страницу заявок с сервера согласно активной сортировке и
   * пагинации. Ошибки перехватываются и попадают в `errorMessage`.
   */
  async function fetchRequests(): Promise<void> {
    logger.debug(
      `[useRequestsStore] fetch sort=${sortField.value}:${sortDirection.value} page=${page.value} size=${pageSize.value}`,
    );
    isLoading.value = true;
    errorMessage.value = null;
    try {
      const pageResult = await requestsApi.list({
        sortField: sortField.value,
        sortDirection: sortDirection.value,
        page: page.value,
        pageSize: pageSize.value,
      });
      items.value = pageResult.items;
      total.value = pageResult.total;
      page.value = pageResult.page;
      pageSize.value = pageResult.pageSize;
      logger.debug(`[useRequestsStore] fetched ${pageResult.items.length}/${pageResult.total} items`);
    } catch (error) {
      errorMessage.value = extractApiErrorMessage(error, 'Не удалось загрузить заявки.');
      logger.error('[useRequestsStore] fetch failed', errorMessage.value);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Сменить сортировку по клику на заголовок колонки.
   *
   * Клик по текущей колонке инвертирует направление; клик по новой — сортирует
   * по ней по возрастанию. Всегда возвращает на первую страницу и перезагружает.
   */
  async function changeSort(nextSortField: RequestSortField): Promise<void> {
    if (sortField.value === nextSortField) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortField.value = nextSortField;
      sortDirection.value = 'asc';
    }
    page.value = DEFAULT_PAGE;
    logger.debug(
      `[useRequestsStore] sort changed → ${sortField.value}:${sortDirection.value}`,
    );
    await fetchRequests();
  }

  /**
   * Перейти на другую страницу и перезагрузить список.
   *
   * Значение вне диапазона игнорируется.
   */
  async function goToPage(nextPage: number): Promise<void> {
    if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value) {
      return;
    }
    page.value = nextPage;
    logger.debug(`[useRequestsStore] page changed → ${page.value}`);
    await fetchRequests();
  }

  /**
   * Создать заявку на покупку.
   *
   * @returns Созданную заявку.
   * @throws Пробрасывает ошибку API, чтобы форма показала сообщение.
   */
  async function createRequest(input: CreateRequestInput): Promise<PurchaseRequestDto> {
    logger.debug('[useRequestsStore] create request');
    const createdRequest = await requestsApi.create(input);
    logger.info(`[useRequestsStore] request created id=${createdRequest.id}`);
    return createdRequest;
  }

  /** Заменить заявку в текущем списке её обновлённой версией. */
  function replaceInList(updatedRequest: PurchaseRequestDto): void {
    const index = items.value.findIndex((request) => request.id === updatedRequest.id);
    if (index !== -1) {
      items.value[index] = updatedRequest;
    }
  }

  /** Подтвердить заявку и обновить её в списке. */
  async function approveRequest(requestId: string): Promise<void> {
    logger.debug(`[useRequestsStore] approve id=${requestId}`);
    try {
      replaceInList(await requestsApi.approve(requestId));
      logger.info(`[useRequestsStore] approved id=${requestId}`);
    } catch (error) {
      errorMessage.value = extractApiErrorMessage(error, 'Не удалось подтвердить заявку.');
      logger.error('[useRequestsStore] approve failed', errorMessage.value);
    }
  }

  /** Отклонить заявку и обновить её в списке. */
  async function rejectRequest(requestId: string): Promise<void> {
    logger.debug(`[useRequestsStore] reject id=${requestId}`);
    try {
      replaceInList(await requestsApi.reject(requestId));
      logger.info(`[useRequestsStore] rejected id=${requestId}`);
    } catch (error) {
      errorMessage.value = extractApiErrorMessage(error, 'Не удалось отклонить заявку.');
      logger.error('[useRequestsStore] reject failed', errorMessage.value);
    }
  }

  return {
    items,
    total,
    page,
    pageSize,
    sortField,
    sortDirection,
    isLoading,
    errorMessage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    fetchRequests,
    changeSort,
    goToPage,
    createRequest,
    approveRequest,
    rejectRequest,
  };
});
