import type { RequestStatus } from '@/types/request.types';

/** Форматтер денежных сумм в рублях. */
const CURRENCY_FORMATTER = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 2,
});

/** Форматтер даты и времени. */
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/**
 * Отформатировать денежную сумму.
 *
 * Сумма приходит из API строкой (десятичное значение из Prisma `Decimal`),
 * чтобы не терять точность; для отображения приводим к числу.
 */
export function formatAmount(amount: string): string {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return amount;
  }
  return CURRENCY_FORMATTER.format(numericAmount);
}

/** Отформатировать ISO-дату для отображения в таблице. */
export function formatDateTime(isoDateTime: string): string {
  const parsedDate = new Date(isoDateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return isoDateTime;
  }
  return DATE_TIME_FORMATTER.format(parsedDate);
}

/** Человекочитаемая подпись статуса заявки. */
export function formatStatus(status: RequestStatus): string {
  const statusLabels: Record<RequestStatus, string> = {
    Pending: 'На рассмотрении',
    Approved: 'Подтверждена',
    Rejected: 'Отклонена',
  };
  return statusLabels[status];
}
