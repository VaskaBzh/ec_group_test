<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRequestsStore } from '@/stores/useRequestsStore';
import RequestsTable from '@/components/RequestsTable.vue';
import { logger } from '@/shared/logger';
import type { RequestSortField } from '@/types/request.types';

/**
 * Экран проверки заявок (роль «проверяющий»).
 *
 * Загружает страницу заявок при монтировании, отдаёт данные и состояние
 * сортировки в таблицу и транслирует её события (сортировка, approve, reject) в
 * стор. Пагинация и skeleton-загрузка добавляются в задаче 8.
 */
const requestsStore = useRequestsStore();
const {
  items,
  sortField,
  sortDirection,
  isLoading,
  errorMessage,
  total,
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
} = storeToRefs(requestsStore);

onMounted(() => {
  logger.debug('[ReviewRequestsView] mounted, loading requests');
  void requestsStore.fetchRequests();
});

/** Передать смену сортировки в стор. */
function handleSort(field: RequestSortField): void {
  void requestsStore.changeSort(field);
}

/** Подтвердить заявку. */
function handleApprove(requestId: string): void {
  void requestsStore.approveRequest(requestId);
}

/** Отклонить заявку. */
function handleReject(requestId: string): void {
  void requestsStore.rejectRequest(requestId);
}

/** Перейти на предыдущую страницу. */
function goToPreviousPage(): void {
  void requestsStore.goToPage(page.value - 1);
}

/** Перейти на следующую страницу. */
function goToNextPage(): void {
  void requestsStore.goToPage(page.value + 1);
}
</script>

<template>
  <section class="review">
    <header class="review__header">
      <h1 class="page-title">Заявки на проверку</h1>
      <span class="review__count">Всего: {{ total }}</span>
    </header>

    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <RequestsTable
      :requests="items"
      :sort-field="sortField"
      :sort-direction="sortDirection"
      :is-loading="isLoading"
      @sort="handleSort"
      @approve="handleApprove"
      @reject="handleReject"
    />

    <footer v-if="totalPages > 1" class="review__pagination">
      <button
        type="button"
        class="button button--ghost button--small"
        :disabled="!hasPreviousPage || isLoading"
        @click="goToPreviousPage"
      >
        Назад
      </button>
      <span class="review__page-info">Страница {{ page }} из {{ totalPages }}</span>
      <button
        type="button"
        class="button button--ghost button--small"
        :disabled="!hasNextPage || isLoading"
        @click="goToNextPage"
      >
        Вперёд
      </button>
    </footer>
  </section>
</template>

<style scoped>
.review__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.review__header .page-title {
  margin-bottom: 12px;
}

.review__count {
  color: var(--color-text-muted);
  font-size: 14px;
}

.review__pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.review__page-info {
  font-size: 14px;
  color: var(--color-text-muted);
}
</style>
