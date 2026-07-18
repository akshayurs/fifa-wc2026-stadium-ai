import { getServerEnv } from "@/lib/env";

/** Outcome of a rate-limit check for a single client key. */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfterMs: number;
}

/** Options for constructing a {@link RateLimiter}. */
export interface RateLimiterOptions {
  /** Maximum number of requests permitted within the window. */
  readonly max: number;
  /** Sliding window length, in milliseconds. */
  readonly windowMs: number;
  /** Clock injection point; defaults to `Date.now`. Enables deterministic tests. */
  readonly now?: () => number;
  /**
   * Number of tracked keys at which fully-expired entries are swept, bounding
   * memory even when clients rotate spoofed identities. Defaults to 10 000.
   */
  readonly sweepThreshold?: number;
}

const DEFAULT_SWEEP_THRESHOLD = 10_000;

/**
 * In-memory sliding-window rate limiter.
 *
 * Chosen deliberately over an external store: it adds no network dependency,
 * secret, or cold-start cost, which suits a stateless demo deployment. Each key
 * retains only the timestamps still inside the current window, so memory stays
 * bounded by active clients.
 */
export class RateLimiter {
  private readonly max: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private readonly sweepThreshold: number;
  private readonly hits = new Map<string, number[]>();

  constructor(options: RateLimiterOptions) {
    this.max = options.max;
    this.windowMs = options.windowMs;
    this.now = options.now ?? Date.now;
    this.sweepThreshold = options.sweepThreshold ?? DEFAULT_SWEEP_THRESHOLD;
  }

  /** Drops keys whose every recorded hit has left the window. */
  private sweep(windowStart: number): void {
    for (const [key, timestamps] of this.hits) {
      if (!timestamps.some((timestamp) => timestamp > windowStart)) {
        this.hits.delete(key);
      }
    }
  }

  /** Records an attempt for `key` and reports whether it is allowed. */
  check(key: string): RateLimitResult {
    const current = this.now();
    const windowStart = current - this.windowMs;

    if (this.hits.size >= this.sweepThreshold) {
      this.sweep(windowStart);
    }
    const recent = (this.hits.get(key) ?? []).filter(
      (timestamp) => timestamp > windowStart,
    );

    if (recent.length >= this.max) {
      this.hits.set(key, recent);
      const earliest = Math.min(...recent);
      return {
        allowed: false,
        limit: this.max,
        remaining: 0,
        retryAfterMs: Math.max(0, earliest + this.windowMs - current),
      };
    }

    recent.push(current);
    this.hits.set(key, recent);
    return {
      allowed: true,
      limit: this.max,
      remaining: this.max - recent.length,
      retryAfterMs: 0,
    };
  }

  /** Number of client keys currently tracked. Useful for observability. */
  get size(): number {
    return this.hits.size;
  }

  /** Removes all tracked state. Intended for tests. */
  reset(): void {
    this.hits.clear();
  }
}

let sharedLimiter: RateLimiter | null = null;

/**
 * Returns a process-wide limiter configured from the environment, constructed
 * lazily on first use.
 */
export function getSharedRateLimiter(): RateLimiter {
  if (!sharedLimiter) {
    const env = getServerEnv();
    sharedLimiter = new RateLimiter({
      max: env.RATE_LIMIT_MAX,
      windowMs: env.RATE_LIMIT_WINDOW_MS,
    });
  }
  return sharedLimiter;
}

/** Clears the shared limiter. Intended for tests. */
export function resetSharedRateLimiter(): void {
  sharedLimiter = null;
}
