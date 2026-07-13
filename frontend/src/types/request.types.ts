/**
 * Централизованные типы frontend вокруг заявок и авторизации.
 *
 * Единый источник правды — общий пакет Zod-контрактов `@ec-group/contracts`.
 * Здесь мы РЕ-ЭКСПОРТИРУЕМ выведенные из схем типы (чтобы весь фронтенд
 * импортировал их из одного места) и добавляем немногочисленные чисто
 * клиентские представления (сессия, состояние сортировки), которых нет в
 * серверном контракте.
 *
 * Правило: не дублировать формы данных руками — если нужен тип запроса/ответа,
 * он берётся из контрактов, а не переопределяется здесь.
 */

export type {
  // Пользователь и роли
  UserDto,
  UserRole,
  // Заявки
  PurchaseRequestDto,
  RequestStatus,
  CreateRequestInput,
  // Список: сортировка и пагинация
  ListRequestsQuery,
  RequestSortField,
  SortDirection,
  PaginatedResult,
  PaginatedPurchaseRequestsDto,
  // Авторизация
  LoginInput,
  RegisterInput,
  AuthTokensDto,
} from '@ec-group/contracts';

import type { AuthTokensDto, UserDto } from '@ec-group/contracts';

/**
 * Ответ backend на успешный вход/регистрацию.
 *
 * Повторяет форму `AuthResponse` бэкенда: пара токенов (`AuthTokensDto`) плюс
 * публичный пользователь. `refreshToken` опционален — текущий backend выдаёт
 * только access-токен; refresh появится вместе с модулем управления сессиями.
 */
export interface AuthResult extends AuthTokensDto {
  /** Публичное представление аутентифицированного пользователя. */
  user: UserDto;
}

/**
 * Сессия пользователя, хранимая на клиенте между перезагрузками.
 *
 * Токены и пользователь сохраняются, чтобы восстановить вход без повторной
 * аутентификации. Пароль и любые секреты сюда не попадают.
 */
export interface AuthSession {
  /** Access-токен JWT для авторизации запросов. */
  accessToken: string;
  /** Refresh-токен, если backend его выдал (иначе сессия живёт до истечения access). */
  refreshToken?: string;
  /** Публичный пользователь текущей сессии. */
  user: UserDto;
}
