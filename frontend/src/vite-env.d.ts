/// <reference types="vite/client" />

/**
 * Типизация переменных окружения frontend (доступны через `import.meta.env`).
 *
 * - `VITE_API_URL` — базовый URL backend-API (например `http://localhost:3000`).
 * - `VITE_LOG_LEVEL` — уровень логирования фронтового логгера
 *   (`ERROR` | `WARN` | `INFO` | `DEBUG`); по умолчанию `INFO`.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_LOG_LEVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}
