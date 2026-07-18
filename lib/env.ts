import "server-only";
import { z } from "zod";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_RATE_LIMIT_MAX,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
} from "@/lib/constants";

/**
 * Server-only environment configuration.
 *
 * Parsed and validated with Zod so the application fails fast — with a clear,
 * value-free message — rather than misbehaving at runtime. Importing
 * `server-only` guarantees these secrets can never be bundled into client code.
 */
const envSchema = z
  .object({
    GEMINI_API_KEY: z.string().min(1).optional(),
    GEMINI_MODEL: z.string().min(1).default(DEFAULT_GEMINI_MODEL),
    STADIUM_AI_MOCK: z
      .string()
      .optional()
      .transform((value) => value === "true"),
    RATE_LIMIT_MAX: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_RATE_LIMIT_MAX),
    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_RATE_LIMIT_WINDOW_MS),
  })
  .superRefine((value, ctx) => {
    if (!value.STADIUM_AI_MOCK && !value.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message: "GEMINI_API_KEY is required unless STADIUM_AI_MOCK=true.",
      });
    }
  });

/** Fully validated, immutable server environment. */
export type ServerEnv = Readonly<z.infer<typeof envSchema>>;

let cachedEnv: ServerEnv | null = null;

/**
 * Returns the validated server environment, parsing once and caching the
 * result. Throws a value-free error listing the offending keys if invalid.
 */
export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const invalidKeys = [
      ...new Set(parsed.error.issues.map((issue) => issue.path.join("."))),
    ].join(", ");
    throw new Error(
      `Invalid server environment configuration. Check: ${invalidKeys}`,
    );
  }

  cachedEnv = Object.freeze(parsed.data);
  return cachedEnv;
}

/** Clears the cached environment. Intended for tests only. */
export function resetServerEnvCache(): void {
  cachedEnv = null;
}
