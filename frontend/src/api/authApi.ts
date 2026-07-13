import { LoginInputSchema, RegisterInputSchema } from '@ec-group/contracts';
import { httpClient } from './httpClient';
import type { AuthResult, LoginInput, RegisterInput } from '@/types/request.types';

/**
 * Типизированный клиент эндпоинтов авторизации (`/auth/*`).
 *
 * Исходящие payload'ы валидируются и нормализуются Zod-схемами из общих
 * контрактов (например, email приводится к нижнему регистру и без пробелов),
 * поэтому на сервер уходит форма, гарантированно совпадающая с контрактом.
 */
export const authApi = {
  /**
   * Аутентифицировать пользователя по email и паролю.
   *
   * @param input - Данные входа (провалидируются `LoginInputSchema`).
   * @returns Токены и публичный пользователь.
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const payload = LoginInputSchema.parse(input);
    const { data } = await httpClient.post<AuthResult>('/auth/login', payload);
    return data;
  },

  /**
   * Зарегистрировать нового пользователя и сразу получить сессию.
   *
   * @param input - Данные регистрации (провалидируются `RegisterInputSchema`).
   * @returns Токены и созданный пользователь.
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const payload = RegisterInputSchema.parse(input);
    const { data } = await httpClient.post<AuthResult>('/auth/register', payload);
    return data;
  },
} as const;
