import type { ZodError } from 'zod';

/**
 * Собрать из ошибки Zod карту «поле → первое сообщение».
 *
 * Формы валидируют ввод общими контрактами и показывают сообщения рядом с
 * полями. Берём по одному (первому) сообщению на поле — этого достаточно для
 * компактного вывода под инпутом.
 *
 * @param error - Ошибка, возвращённая `schema.safeParse(...)`.
 * @returns Объект вида `{ email: '...', password: '...' }`.
 */
export function collectFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const fieldName = issue.path[0];
    if (typeof fieldName === 'string' && !(fieldName in fieldErrors)) {
      fieldErrors[fieldName] = issue.message;
    }
  }
  return fieldErrors;
}
