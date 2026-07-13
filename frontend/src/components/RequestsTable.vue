<script setup lang="ts">
import type { RequestsTableProps, RequestsTableEmits } from '@/types/RequestsTable.types';
import { REQUESTS_TABLE_COLUMNS } from '@/types/RequestsTable.types';
import RequestsTableSkeleton from '@/components/RequestsTableSkeleton.vue';
import { formatAmount, formatDateTime, formatStatus } from '@/shared/format';
import type { RequestSortField } from '@/types/request.types';

/**
 * Презентационная таблица заявок.
 *
 * Отрисовывает переданные заявки, подсвечивает активную сортировку в заголовках
 * и предлагает проверяющему действия approve/reject для заявок «на рассмотрении».
 * Никакой доменной логики и обращений к API — только props и события (контракт
 * вынесен в `RequestsTable.types.ts`).
 */
const props = defineProps<RequestsTableProps>();
const emit = defineEmits<RequestsTableEmits>();

/** Обработать клик по сортируемому заголовку. */
function handleHeaderClick(sortField: RequestSortField | null): void {
  if (sortField) {
    emit('sort', sortField);
  }
}

/** Символ индикатора сортировки для колонки (пусто, если не активна). */
function sortIndicator(columnSortField: RequestSortField | null): string {
  if (!columnSortField || columnSortField !== props.sortField) {
    return '';
  }
  return props.sortDirection === 'asc' ? '▲' : '▼';
}
</script>

<template>
  <div class="requests-table__wrapper">
    <table class="requests-table">
      <thead>
        <tr>
          <th
            v-for="column in REQUESTS_TABLE_COLUMNS"
            :key="column.label"
            :class="{ 'requests-table__th--sortable': column.sortField }"
            @click="handleHeaderClick(column.sortField)"
          >
            <span>{{ column.label }}</span>
            <span v-if="column.sortField" class="requests-table__sort">{{
              sortIndicator(column.sortField)
            }}</span>
          </th>
        </tr>
      </thead>

      <RequestsTableSkeleton
        v-if="props.isLoading"
        :columns="REQUESTS_TABLE_COLUMNS.length"
      />

      <tbody v-else-if="props.requests.length === 0">
        <tr>
          <td :colspan="REQUESTS_TABLE_COLUMNS.length" class="requests-table__empty">
            Заявок пока нет.
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr v-for="request in props.requests" :key="request.id">
          <td>{{ request.title }}</td>
          <td>{{ request.quantity }}</td>
          <td>{{ formatAmount(request.amount) }}</td>
          <td>{{ request.author.email }}</td>
          <td>
            <span
              class="requests-table__status"
              :class="`requests-table__status--${request.status.toLowerCase()}`"
            >
              {{ formatStatus(request.status) }}
            </span>
          </td>
          <td>{{ formatDateTime(request.createdAt) }}</td>
          <td>
            <div v-if="request.status === 'Pending'" class="requests-table__actions">
              <button
                type="button"
                class="button button--success button--small"
                @click="emit('approve', request.id)"
              >
                Подтвердить
              </button>
              <button
                type="button"
                class="button button--danger button--small"
                @click="emit('reject', request.id)"
              >
                Отклонить
              </button>
            </div>
            <span v-else class="requests-table__no-actions">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.requests-table__wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.requests-table th,
.requests-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}

.requests-table thead th {
  background: #f9fafb;
  font-weight: 600;
  user-select: none;
}

.requests-table__th--sortable {
  cursor: pointer;
}

.requests-table__th--sortable:hover {
  color: var(--color-primary);
}

.requests-table__sort {
  margin-left: 6px;
  font-size: 11px;
  color: var(--color-primary);
}

.requests-table__empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 32px 16px;
}

.requests-table__actions {
  display: flex;
  gap: 8px;
}

.requests-table__no-actions {
  color: var(--color-text-muted);
}

.requests-table__status {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.requests-table__status--pending {
  background: #fef3c7;
  color: var(--color-warning);
}

.requests-table__status--approved {
  background: #dcfce7;
  color: var(--color-success);
}

.requests-table__status--rejected {
  background: #fee2e2;
  color: var(--color-danger);
}
</style>
