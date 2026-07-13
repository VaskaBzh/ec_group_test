import type { Router } from 'vue-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { onSessionExpired } from '@/shared/session';
import { resolveHomeRouteForRole } from './roleNavigation';
import { logger } from '@/shared/logger';

/**
 * Навесить ролевые guard'ы на роутер и подключить реакцию на истечение сессии.
 *
 * Правила навигации:
 * - Неавторизованного пользователя пускаем только на публичные маршруты (вход),
 *   иначе редиректим на страницу входа.
 * - Авторизованного уводим со страницы входа на домашний маршрут его роли.
 * - Маршрут с `meta.role` доступен только пользователю соответствующей роли;
 *   иначе — редирект на его домашний маршрут.
 *
 * Дополнительно подписываемся на шину «сессия истекла»: при неудачном продлении
 * токена стор очищается, а пользователь корректно уводится на вход.
 *
 * @param router - Экземпляр роутера, на который навешиваются guard'ы.
 */
export function registerRouterGuards(router: Router): void {
  router.beforeEach((to) => {
    const authStore = useAuthStore();
    const isPublicRoute = to.meta.public === true;
    const requiredRole = to.meta.role;
    const currentRole = authStore.role;

    if (!authStore.isAuthenticated || currentRole === null) {
      if (isPublicRoute) {
        return true;
      }
      logger.debug(`[routerGuard] to=${String(to.name)} role=none → redirect login`);
      return { name: 'login' };
    }

    if (isPublicRoute) {
      logger.debug(`[routerGuard] to=${String(to.name)} already authenticated → home`);
      return resolveHomeRouteForRole(currentRole);
    }

    if (requiredRole && requiredRole !== currentRole) {
      logger.debug(
        `[routerGuard] to=${String(to.name)} role=${currentRole} lacks ${requiredRole} → home`,
      );
      return resolveHomeRouteForRole(currentRole);
    }

    logger.debug(`[routerGuard] to=${String(to.name)} role=${currentRole} → allow`);
    return true;
  });

  onSessionExpired(() => {
    const authStore = useAuthStore();
    authStore.handleSessionExpired();
    logger.warn('[routerGuard] session expired → redirecting to login');
    void router.replace({ name: 'login' });
  });
}
