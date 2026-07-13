/**
 * Единый фронтовый логгер — тонкая обёртка над `console` с уровнями.
 *
 * Уровень берётся из `VITE_LOG_LEVEL` (по умолчанию `INFO`). Сообщение выводится
 * только если его уровень не «тише» настроенного порога. Так verbose-логи
 * (`DEBUG`) можно включать через окружение, не засоряя продакшн-консоль.
 *
 * Контракт: НИКОГДА не передавать в логи токены, пароли и прочие секреты —
 * ответственность вызывающего кода.
 */

/** Поддерживаемые уровни логирования, от самого «тихого» к самому подробному. */
export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';

/** Числовой вес уровня: чем больше, тем подробнее. */
const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

/** Уровень по умолчанию, когда `VITE_LOG_LEVEL` не задан или некорректен. */
const DEFAULT_LOG_LEVEL: LogLevel = 'INFO';

/**
 * Разобрать значение `VITE_LOG_LEVEL` в один из поддерживаемых уровней.
 *
 * Регистр не важен; неизвестное значение откатывается к {@link DEFAULT_LOG_LEVEL}.
 */
function resolveConfiguredLevel(rawLevel: string | undefined): LogLevel {
  if (!rawLevel) {
    return DEFAULT_LOG_LEVEL;
  }
  const normalizedLevel = rawLevel.trim().toUpperCase();
  if (normalizedLevel in LOG_LEVEL_WEIGHT) {
    return normalizedLevel as LogLevel;
  }
  return DEFAULT_LOG_LEVEL;
}

const configuredLevel = resolveConfiguredLevel(import.meta.env.VITE_LOG_LEVEL);

/** Выводить ли сообщение указанного уровня при текущем пороге. */
function isLevelEnabled(level: LogLevel): boolean {
  return LOG_LEVEL_WEIGHT[level] <= LOG_LEVEL_WEIGHT[configuredLevel];
}

/**
 * Логгер приложения. Методы соответствуют уровням; сообщение принято передавать
 * с префиксом-областью, например `logger.debug('[App] mounted')`.
 */
export const logger = {
  /** Ошибки, требующие внимания (сетевые сбои, неожиданные ответы API). */
  error(message: string, ...details: unknown[]): void {
    if (isLevelEnabled('ERROR')) {
      console.error(message, ...details);
    }
  },
  /** Предупреждения: ожидаемые, но нежелательные ситуации (401, отказ гварда). */
  warn(message: string, ...details: unknown[]): void {
    if (isLevelEnabled('WARN')) {
      console.warn(message, ...details);
    }
  },
  /** Информационные вехи жизненного цикла (успешный вход, старт приложения). */
  info(message: string, ...details: unknown[]): void {
    if (isLevelEnabled('INFO')) {
      console.info(message, ...details);
    }
  },
  /** Подробная трассировка потоков (запросы, смена сортировки/страницы). */
  debug(message: string, ...details: unknown[]): void {
    if (isLevelEnabled('DEBUG')) {
      console.debug(message, ...details);
    }
  },
} as const;

/** Текущий активный уровень логирования (для диагностики). */
export function getConfiguredLogLevel(): LogLevel {
  return configuredLevel;
}
