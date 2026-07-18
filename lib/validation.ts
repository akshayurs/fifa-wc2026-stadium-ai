import { z } from "zod";
import {
  LOCALE_PATTERN,
  MAX_MESSAGE_LENGTH,
  MIN_MESSAGE_LENGTH,
} from "@/lib/constants";

/**
 * Request schemas for the AI endpoints.
 *
 * Every field is length- and pattern-bounded so untrusted input cannot inflate
 * prompts, exhaust tokens, or smuggle control characters into the model call.
 */

/** Body accepted by `POST /api/assistant`. */
export const assistantRequestSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(MIN_MESSAGE_LENGTH, "Message is too short.")
      .max(MAX_MESSAGE_LENGTH, "Message is too long."),
    locale: z
      .string()
      .trim()
      .regex(LOCALE_PATTERN, "Invalid locale.")
      .optional(),
  })
  .strict();

export type AssistantRequest = z.infer<typeof assistantRequestSchema>;

/** Body accepted by `POST /api/ops-briefing`. */
export const opsBriefingRequestSchema = z
  .object({
    focusZoneId: z
      .string()
      .trim()
      .regex(/^[a-z0-9-]{1,24}$/, "Invalid zone id.")
      .optional(),
  })
  .strict();

export type OpsBriefingRequest = z.infer<typeof opsBriefingRequestSchema>;

/** Discriminated result of parsing an untrusted JSON body against a schema. */
export type ParseResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly message: string };

/**
 * Safely parses an already-decoded JSON value against `schema`, returning a
 * flat, caller-safe error message rather than throwing.
 */
export function parseBody<T>(
  schema: z.ZodType<T>,
  value: unknown,
): ParseResult<T> {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const message = result.error.issues.map((issue) => issue.message).join(" ");
  return { success: false, message };
}
