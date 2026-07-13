/**
 * Parse a human-friendly duration string into milliseconds.
 *
 * Accepts the same compact `<number><unit>` notation used by `@nestjs/jwt`
 * token lifetimes — `s` (seconds), `m` (minutes), `h` (hours), `d` (days) — as
 * well as a bare integer, which is interpreted as milliseconds. Used to turn
 * `JWT_REFRESH_TTL` / `JWT_ACCESS_TTL` into absolute expiry instants.
 *
 * @param duration - Duration such as `900s`, `15m`, `1h`, `7d` or `3600000`.
 * @returns The equivalent number of milliseconds.
 * @throws {Error} When the string does not match a supported format.
 *
 * @example
 * ```ts
 * parseDurationToMilliseconds('15m'); // 900_000
 * parseDurationToMilliseconds('7d');  // 604_800_000
 * ```
 */
export function parseDurationToMilliseconds(duration: string): number {
  const millisecondsPerUnit: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(duration.trim());
  if (match === null) {
    throw new Error(
      `Unsupported duration format: "${duration}". Expected e.g. 900s, 15m, 1h, 7d.`,
    );
  }

  const value = Number(match[1]);
  const unit = match[2];

  if (unit === undefined || unit === 'ms') {
    return value;
  }
  return value * millisecondsPerUnit[unit];
}
