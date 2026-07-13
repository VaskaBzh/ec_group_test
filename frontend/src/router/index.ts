import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { registerRouterGuards } from './guards';
import type { UserRole } from '@/types/request.types';

declare module 'vue-router' {
  /** Дополнительные поля метаданных маршрута для авторизации. */
  interface RouteMeta {
    /** Публичный маршрут — доступен без авторизации (страница входа). */
    public?: boolean;
    /** Роль, необходимая для доступа к маршруту (если ограничен). */
    role?: UserRole;
  }
}

/**
 * Маршруты приложения.
 *
 * Заявитель работает с созданием заявки, проверяющий — со списком на проверку.
 * Доступ по ролям и редиректы обеспечивают guard'ы из `./guards`.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/requests/new',
    name: 'create-request',
    component: () => import('@/views/CreateRequestView.vue'),
    meta: { role: 'Requester' },
  },
  {
    path: '/requests',
    name: 'review-requests',
    component: () => import('@/views/ReviewRequestsView.vue'),
    meta: { role: 'Reviewer' },
  },
  {
    path: '/',
    redirect: { name: 'login' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'login' },
  },
];

/** Экземпляр роутера с history-режимом. */
export const router = createRouter({
  history: createWebHistory(),
  routes,
});

registerRouterGuards(router);
