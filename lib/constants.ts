/**
 * Application-wide constants.
 *
 * Pure, non-secret values shared across the server and client. Secrets live
 * exclusively in environment variables (see {@link file://./env.ts}).
 */

/** Product name shown in metadata and UI. */
export const APP_NAME = "Stadium Pulse";

/** The event this solution targets. */
export const TOURNAMENT = "FIFA World Cup 2026";

/** Generic venue context used in prompts and copy (no hardcoded venue data). */
export const VENUE_CONTEXT = "a FIFA World Cup 2026 host venue";

/** Default Gemini model; overridable via `GEMINI_MODEL`. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Inclusive bounds for a fan Assistant message, in characters. */
export const MIN_MESSAGE_LENGTH = 2;
export const MAX_MESSAGE_LENGTH = 1000;

/** BCP-47-style locale accepted by the API (e.g. "en", "es-MX", "zh-Hant"). */
export const LOCALE_PATTERN = /^[a-zA-Z]{2}(-[a-zA-Z]{2,4})?$/;

/** Upper bound on an API request body, in bytes. */
export const MAX_BODY_BYTES = 16_384;

/** Budget for generating the live operations snapshot before falling back. */
export const SNAPSHOT_TIMEOUT_MS = 8_000;

/** Default sliding-window rate limit (requests per window, per client). */
export const DEFAULT_RATE_LIMIT_MAX = 20;

/** Default sliding-window length, in milliseconds. */
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

/** Upper bound on Gemini output tokens, to cap latency and cost. */
export const MAX_OUTPUT_TOKENS = 800;

/** Sampling temperature for grounded, consistent operational answers. */
export const MODEL_TEMPERATURE = 0.4;
