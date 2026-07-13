import type {
  PurchaseRequestDto,
  RequestSortField,
  SortDirection,
} from '@/types/request.types';

/**
 * Контракт компонента `RequestsTable` (props/emits), вынесенный из SFC.
 *
 * Компонент презентационный: он получает данные и текущее состояние сортировки
 * через props и лишь сообщает о намерениях пользователя через события —
 * загрузку, сортировку и решения по заявкам оркеструет родитель через стор.
 */

/** Входные свойства таблицы заявок. */
export interface RequestsTableProps {
  /** Заявки для отображения на текущей странице. */
  requests: PurchaseRequestDto[];
  /** Активное поле сортировки (для индикатора в заголовке). */
  sortField: RequestSortField;
  /** Активное направление сортировки. */
  sortDirection: SortDirection;
  /** Идёт ли загрузка (для показа skeleton вместо строк). */
  isLoading: boolean;
}

/** События, испускаемые таблицей заявок. */
export interface RequestsTableEmits {
  /** Пользователь кликнул по сортируемому заголовку колонки. */
  (event: 'sort', field: RequestSortField): void;
  /** Пользователь подтвердил заявку. */
  (event: 'approve', requestId: string): void;
  /** Пользователь отклонил заявку. */
  (event: 'reject', requestId: string): void;
}

/** Описание одной колонки таблицы. */
export interface RequestsTableColumn {
  /** Заголовок колонки. */
  label: string;
  /** Поле сортировки, если колонка сортируемая (иначе `null`). */
  sortField: RequestSortField | null;
}

/** Колонки таблицы заявок в порядке отображения. */
export const REQUESTS_TABLE_COLUMNS: RequestsTableColumn[] = [
  { label: 'Наименование', sortField: null },
  { label: 'Кол-во', sortField: null },
  { label: 'Сумма', sortField: 'amount' },
  { label: 'Автор', sortField: 'author' },
  { label: 'Статус', sortField: 'status' },
  { label: 'Создана', sortField: 'createdAt' },
  { label: 'Действия', sortField: null },
];
