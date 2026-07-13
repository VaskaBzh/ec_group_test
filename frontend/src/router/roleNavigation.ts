import type { RouteLocationRaw } from 'vue-router';
import type { UserRole } from '@/types/request.types';

/**
 * Домашний маршрут для роли пользователя.
 *
 * Заявитель попадает на создание заявки, проверяющий — на список для проверки.
 * Используется и после входа (редирект по роли), и в guard'ах роутера, чтобы
 * не дублировать это соответствие.
 *
 * @param role - Роль текущего пользователя.
 * @returns Маршрут, на который следует направить пользователя этой роли.
 */
export function resolveHomeRouteForRole(role: UserRole): RouteLocationRaw {
  if (role === 'Reviewer') {
    return { name: 'review-requests' };
  }
  return { name: 'create-request' };
}
