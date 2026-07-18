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

/** Representative host venue used for the simulated operations data. */
export const VENUE_NAME = "MetLife Stadium, New York/New Jersey";

/** Default Gemini model; overridable via `GEMINI_MODEL`. */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** Inclusive bounds for a fan Assistant message, in characters. */
export const MIN_MESSAGE_LENGTH = 2;
export const MAX_MESSAGE_LENGTH = 1000;

/** Default sliding-window rate limit (requests per window, per client). */
export const DEFAULT_RATE_LIMIT_MAX = 20;

/** Default sliding-window length, in milliseconds. */
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;

/** Upper bound on Gemini output tokens, to cap latency and cost. */
export const MAX_OUTPUT_TOKENS = 800;

/** Sampling temperature for grounded, consistent operational answers. */
export const MODEL_TEMPERATURE = 0.4;
