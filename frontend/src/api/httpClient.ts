import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { AuthTokensDtoSchema } from '@ec-group/contracts';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  updateStoredTokens,
  notifySessionExpired,
} from '@/shared/session';
import { logger } from '@/shared/logger';

/**
 * HTTP-клиент frontend поверх axios.
 *
 * Отвечает за две сквозные заботы, чтобы сторы/компоненты о них не думали:
 *
 * 1. **JWT-интерцептор запроса** — подставляет `Authorization: Bearer <access>`
 *    из сохранённой сессии.
 * 2. **Интерцептор ответа на 401** — пытается один раз продлить сессию через
 *    `POST /auth/refresh` (когда есть refresh-токен) и повторить запрос; если
 *    продление невозможно — корректно завершает сессию (выход + редирект на
 *    вход через шину `notifySessionExpired`).
 *
 * Текущий backend выдаёт только access-токен и ещё не имеет эндпоинта
 * `/auth/refresh`, поэтому при 401 без refresh-токена клиент сразу выполняет
 * выход. Логика продления написана вперёд — она включится автоматически, как
 * только модуль управления сессиями начнёт выдавать refresh-токены.
 *
 * Контракт логирования: метод/URL и статус — на DEBUG; сетевые ошибки — ERROR;
 * токены в логи НЕ попадают.
 */

/** Базовый URL backend-API; по умолчанию локальный NestJS на порту 3000. */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Путь эндпоинта продления сессии (появляется вместе с модулем сессий). */
const REFRESH_ENDPOINT_PATH = '/auth/refresh';

/** Конфигурация запроса с пометкой о выполненной повторной попытке после 401. */
interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  /** `true`, если запрос уже повторяли после продления — защита от циклов. */
  hasBeenRetried?: boolean;
}

/** Единственный экземпляр клиента, используемый всем API-слоем. */
export const httpClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

httpClient.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  logger.debug(`[httpClient] → ${describeRequest(config)}`);
  return config;
});

/**
 * Разделяемый промис активного продления.
 *
 * Если несколько запросов упали на 401 одновременно, продление выполняется один
 * раз, а все ожидающие переиспользуют результат.
 */
let activeRefreshPromise: Promise<string | null> | null = null;

httpClient.interceptors.response.use(
  (response) => {
    logger.debug(`[httpClient] ${response.status} ← ${describeRequest(response.config)}`);
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!error.response) {
      logger.error(
        `[httpClient] network error ${originalRequest ? describeRequest(originalRequest) : ''}`,
        error.message,
      );
      return Promise.reject(error);
    }

    const { status } = error.response;
    logger.debug(
      `[httpClient] ${status} ← ${originalRequest ? describeRequest(originalRequest) : 'unknown request'}`,
    );

    const shouldAttemptRecovery =
      status === 401 &&
      originalRequest !== undefined &&
      !originalRequest.hasBeenRetried &&
      !isAuthEndpoint(originalRequest.url) &&
      getStoredAccessToken() !== null;

    if (shouldAttemptRecovery && originalRequest) {
      originalRequest.hasBeenRetried = true;
      logger.debug('[httpClient] 401 → attempting session refresh');

      if (!activeRefreshPromise) {
        activeRefreshPromise = refreshAccessToken().finally(() => {
          activeRefreshPromise = null;
        });
      }
      const renewedAccessToken = await activeRefreshPromise;

      if (renewedAccessToken) {
        logger.debug('[httpClient] session refreshed, retrying original request');
        originalRequest.headers = AxiosHeaders.from(originalRequest.headers);
        originalRequest.headers.set('Authorization', `Bearer ${renewedAccessToken}`);
        return httpClient(originalRequest);
      }

      logger.warn('[httpClient] session could not be refreshed, signing out');
      notifySessionExpired();
    }

    return Promise.reject(error);
  },
);

/**
 * Попытаться продлить сессию по refresh-токену.
 *
 * Использует «голый» axios (без интерцепторов клиента), чтобы 401 самого
 * продления не вызвал рекурсию. Ответ валидируется контрактом `AuthTokensDto`.
 *
 * @returns Новый access-токен либо `null`, если продление невозможно/провалилось.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    logger.debug('[httpClient] no refresh token available, cannot refresh');
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}${REFRESH_ENDPOINT_PATH}`, { refreshToken });
    const parsedTokens = AuthTokensDtoSchema.safeParse(response.data);
    if (!parsedTokens.success) {
      logger.warn('[httpClient] refresh response did not match AuthTokensDto contract');
      return null;
    }
    updateStoredTokens(parsedTokens.data.accessToken, parsedTokens.data.refreshToken);
    logger.debug('[httpClient] refresh succeeded');
    return parsedTokens.data.accessToken;
  } catch (refreshError) {
    logger.warn('[httpClient] refresh request failed', (refreshError as Error).message);
    return null;
  }
}

/** Относится ли URL к эндпоинтам авторизации (их 401 нельзя лечить продлением). */
function isAuthEndpoint(url: string | undefined): boolean {
  return url !== undefined && url.includes('/auth/');
}

/** Короткое описание запроса `METHOD /path` для логов (без тела и токенов). */
function describeRequest(config: InternalAxiosRequestConfig): string {
  const method = (config.method ?? 'get').toUpperCase();
  return `${method} ${config.url ?? ''}`;
}

/**
 * Извлечь человекочитаемое сообщение об ошибке из ответа backend.
 *
 * Backend отдаёт единый формат ошибки (`{ statusCode, error, message, ... }`).
 * Функция достаёт `message`; для сетевых сбоев и нестандартных ответов
 * возвращает разумный дефолт.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallbackMessage = 'Произошла ошибка. Попробуйте ещё раз.',
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Нет связи с сервером. Проверьте подключение.';
    }
    const responseBody = error.response.data as { message?: unknown } | undefined;
    if (responseBody && typeof responseBody.message === 'string') {
      return responseBody.message;
    }
  }
  return fallbackMessage;
}
