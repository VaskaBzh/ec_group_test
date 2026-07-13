import { LogLevel } from '@nestjs/common';

/**
 * Порядок уровней логирования NestJS от самого подробного к самому строгому.
 * Индекс уровня используется как порог: включаются он сам и все более строгие.
 */
const LOG_LEVEL_SEVERITY_ORDER: LogLevel[] = [
  'verbose',
  'debug',
  'log',
  'warn',
  'error',
  'fatal',
];

/**
 * Соответствие значений переменной окружения `LOG_LEVEL`
 * (DEBUG/INFO/WARN/ERROR и синонимы) уровням логгера NestJS.
 */
const LOG_LEVEL_ALIASES: Record<string, LogLevel> = {
  VERBOSE: 'verbose',
  TRACE: 'verbose',
  DEBUG: 'debug',
  INFO: 'log',
  LOG: 'log',
  WARN: 'warn',
  WARNING: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
};

const DEFAULT_LOG_LEVEL: LogLevel = 'debug';

/**
 * Строит список включённых уровней логирования для NestJS-приложения
 * на основе переменной окружения `LOG_LEVEL`.
 *
 * Возвращает пороговый набор: выбранный уровень и все более строгие
 * (например, `INFO` → `['log', 'warn', 'error', 'fatal']`). Неизвестное или
 * пустое значение откатывается к `debug`, что удобно на этапе разработки.
 *
 * @param rawLogLevel Значение `process.env.LOG_LEVEL` (регистр не важен).
 * @returns Массив уровней для передачи в `NestFactory.create({ logger })`.
 */
export function resolveEnabledLogLevels(rawLogLevel?: string): LogLevel[] {
  const normalized = rawLogLevel?.trim().toUpperCase();
  const threshold =
    (normalized && LOG_LEVEL_ALIASES[normalized]) || DEFAULT_LOG_LEVEL;

  const thresholdIndex = LOG_LEVEL_SEVERITY_ORDER.indexOf(threshold);
  return LOG_LEVEL_SEVERITY_ORDER.slice(thresholdIndex);
}
