import "server-only";

/**
 * Minimal structured, server-only logger.
 *
 * Centralising logging keeps `console` usage out of the rest of the codebase
 * (enforced by the `no-console` lint rule) and guarantees that internal error
 * details are recorded server-side only — they are never returned to clients.
 */

interface LogFields {
  readonly [key: string]: string | number | boolean;
}

function emit(level: "error" | "warn", scope: string, fields: LogFields): void {
  const entry = JSON.stringify({ level, scope, ...fields });
  /* eslint-disable-next-line no-console -- single, intentional server sink */
  console[level](entry);
}

/** Logs an error server-side, extracting a safe message from any thrown value. */
export function logError(
  scope: string,
  error: unknown,
  extra: LogFields = {},
): void {
  const message = error instanceof Error ? error.message : String(error);
  emit("error", scope, { message, ...extra });
}

/** Logs a warning server-side. */
export function logWarning(
  scope: string,
  message: string,
  extra: LogFields = {},
): void {
  emit("warn", scope, { message, ...extra });
}
