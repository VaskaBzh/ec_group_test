import type { AuthSession } from '@/types/request.types';
import { logger } from '@/shared/logger';

/**
 * Слой хранения пользовательской сессии.
 *
 * Инкапсулирует персист в `localStorage` (переживает перезагрузку страницы) и
 * доступ к токенам для HTTP-интерцепторов, которые работают вне контекста
 * компонентов/сторов. Реактивную обёртку над этими данными держит
 * `useAuthStore`; здесь — только сырое чтение/запись и шина «сессия истекла».
 *
 * Контракт: в сессии нет паролей — только токены и публичный пользователь.
 */

/** Ключ, под которым сессия сохраняется в `localStorage`. */
const SESSION_STORAGE_KEY = 'ec-group.auth.session';

/** Обработчик, вызываемый когда сессия окончательно признана недействительной. */
type SessionExpiredHandler = () => void;

let sessionExpiredHandler: SessionExpiredHandler | null = null;

/**
 * Прочитать сохранённую сессию из `localStorage`.
 *
 * @returns Восстановленную сессию или `null`, если её нет либо она повреждена.
 */
export function loadStoredSession(): AuthSession | null {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }
  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    logger.warn('[session] stored session is corrupted, dropping it');
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

/** Сохранить сессию в `localStorage`. */
export function saveStoredSession(session: AuthSession): void {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  logger.debug('[session] session persisted');
}

/** Удалить сохранённую сессию. */
export function clearStoredSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  logger.debug('[session] session cleared');
}

/** Access-токен текущей сессии или `null`. */
export function getStoredAccessToken(): string | null {
  return loadStoredSession()?.accessToken ?? null;
}

/** Refresh-токен текущей сессии или `null` (если backend его не выдал). */
export function getStoredRefreshToken(): string | null {
  return loadStoredSession()?.refreshToken ?? null;
}

/**
 * Обновить токены сохранённой сессии после успешного продления.
 *
 * Пользователь в сессии сохраняется; меняются только токены. Если сессии нет —
 * операция игнорируется (продлевать нечего).
 */
export function updateStoredTokens(accessToken: string, refreshToken?: string): void {
  const currentSession = loadStoredSession();
  if (!currentSession) {
    return;
  }
  saveStoredSession({
    ...currentSession,
    accessToken,
    refreshToken: refreshToken ?? currentSession.refreshToken,
  });
}

/**
 * Зарегистрировать обработчик истечения сессии.
 *
 * Роутер/стор подписываются здесь, чтобы очистить состояние и увести
 * пользователя на страницу входа, когда продлить сессию не удалось.
 */
export function onSessionExpired(handler: SessionExpiredHandler): void {
  sessionExpiredHandler = handler;
}

/**
 * Сообщить о том, что сессия окончательно недействительна.
 *
 * Очищает хранилище и вызывает зарегистрированный обработчик (если он есть).
 */
export function notifySessionExpired(): void {
  clearStoredSession();
  if (sessionExpiredHandler) {
    sessionExpiredHandler();
  }
}
