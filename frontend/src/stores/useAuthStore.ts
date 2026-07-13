import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { authApi } from '@/api/authApi';
import {
  clearStoredSession,
  loadStoredSession,
  saveStoredSession,
} from '@/shared/session';
import { logger } from '@/shared/logger';
import type {
  AuthResult,
  AuthSession,
  LoginInput,
  RegisterInput,
  UserDto,
  UserRole,
} from '@/types/request.types';

/**
 * Стор авторизации и текущей сессии.
 *
 * Единый владелец состояния сессии на клиенте: хранит токены и публичного
 * пользователя, восстанавливает сессию из `localStorage` при старте (переживает
 * перезагрузку) и предоставляет вход/регистрацию/выход. Персист делегируется
 * слою `shared/session`, который также читают HTTP-интерцепторы.
 *
 * Бизнес-правило доступа: роль пользователя (`Requester`/`Reviewer`) определяет
 * доступные маршруты — этим пользуются guard'ы роутера.
 */
export const useAuthStore = defineStore('auth', () => {
  /** Текущая сессия или `null`, если пользователь не аутентифицирован. */
  const session = ref<AuthSession | null>(loadStoredSession());

  /** Аутентифицирован ли пользователь. */
  const isAuthenticated = computed<boolean>(() => session.value !== null);

  /** Публичный пользователь текущей сессии (или `null`). */
  const currentUser = computed<UserDto | null>(() => session.value?.user ?? null);

  /** Роль текущего пользователя (или `null`). */
  const role = computed<UserRole | null>(() => session.value?.user.role ?? null);

  /** Является ли текущий пользователь заявителем. */
  const isRequester = computed<boolean>(() => role.value === 'Requester');

  /** Является ли текущий пользователь проверяющим. */
  const isReviewer = computed<boolean>(() => role.value === 'Reviewer');

  /** Применить ответ авторизации: собрать сессию, сохранить и активировать. */
  function applyAuthResult(authResult: AuthResult): void {
    const nextSession: AuthSession = {
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      user: authResult.user,
    };
    session.value = nextSession;
    saveStoredSession(nextSession);
  }

  /**
   * Войти по email и паролю.
   *
   * @throws Пробрасывает ошибку API, чтобы форма показала сообщение.
   */
  async function login(input: LoginInput): Promise<void> {
    logger.debug(`[useAuthStore] login email=${input.email}`);
    const authResult = await authApi.login(input);
    applyAuthResult(authResult);
    logger.info(`[useAuthStore] login success user=${authResult.user.id} role=${authResult.user.role}`);
  }

  /**
   * Зарегистрироваться и сразу войти.
   *
   * @throws Пробрасывает ошибку API, чтобы форма показала сообщение.
   */
  async function register(input: RegisterInput): Promise<void> {
    logger.debug(`[useAuthStore] register email=${input.email} role=${input.role}`);
    const authResult = await authApi.register(input);
    applyAuthResult(authResult);
    logger.info(`[useAuthStore] register success user=${authResult.user.id} role=${authResult.user.role}`);
  }

  /** Выйти: очистить сессию локально и в хранилище. */
  function logout(): void {
    logger.info(`[useAuthStore] logout user=${currentUser.value?.id ?? 'anonymous'}`);
    session.value = null;
    clearStoredSession();
  }

  /**
   * Обработать истечение сессии (вызывается интерцептором через шину сессий).
   *
   * Хранилище к этому моменту уже очищено `notifySessionExpired`; здесь мы
   * сбрасываем только реактивное состояние.
   */
  function handleSessionExpired(): void {
    logger.warn('[useAuthStore] session expired, clearing state');
    session.value = null;
  }

  return {
    session,
    isAuthenticated,
    currentUser,
    role,
    isRequester,
    isReviewer,
    login,
    register,
    logout,
    handleSessionExpired,
  };
});
