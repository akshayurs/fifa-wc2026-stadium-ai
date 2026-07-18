# Architecture

Stadium Pulse is a Next.js 16 App Router application. Logic is deliberately
pushed into small, pure, unit-tested modules under `lib/`, keeping React
components and route handlers thin.

## Layers

### 1. Edge — `proxy.ts`

Runs before every page request. Generates a fresh CSP nonce, builds a strict
`strict-dynamic` Content-Security-Policy ([`lib/security.ts`](lib/security.ts)),
and attaches it to the request (so Next.js can stamp the nonce onto its scripts
and inline styles) and the response. Baseline security headers (HSTS, framing,
sniffing, referrer, permissions, COOP) are set in
[`next.config.ts`](next.config.ts) for all routes, including the API.

### 2. Presentation — `app/` + `components/`

- `app/layout.tsx` provides landmarks (`header`/`nav`/`main`/`footer`), the skip
  link, fonts, and rich metadata.
- `app/page.tsx` is a React Server Component that reads a per-request operations
  snapshot and renders the dashboard and assistant. It is `force-dynamic` so the
  snapshot is fresh and the CSP nonce applies.
- Presentational components (`StatusBadge`, `MetricCard`, `ZoneOccupancy`,
  `IncidentFeed`, `OpsDashboard`) are pure and prop-driven.
- Interactive panels (`AssistantPanel`, `OpsBriefingPanel`) are client
  components that share the `useTextStream` hook for streaming state, in-flight
  cancellation, and error handling.

### 3. API — `app/api/*`

- `POST /api/assistant` — fan Assistant. Rate-limit → decode JSON → validate →
  stream Gemini reply.
- `POST /api/ops-briefing` — grounds Gemini in the live snapshot summary and
  streams a briefing.
- `GET /api/health` — liveness probe.

Each handler is a thin pipeline over shared helpers: `enforceRateLimit` and
`readJsonBody` ([`lib/api-guard.ts`](lib/api-guard.ts)), `parseBody`
([`lib/validation.ts`](lib/validation.ts)), and `streamTextResponse`
([`lib/stream.ts`](lib/stream.ts)).

### 4. Domain & integration — `lib/`

| Module               | Responsibility                                                     |
| -------------------- | ------------------------------------------------------------------ |
| `env.ts`             | Zod-validated, cached, server-only environment                     |
| `constants.ts`       | Non-secret shared constants                                        |
| `gemini.ts`          | Server-only Gemini client, hardened prompts, mock mode             |
| `stadium-data.ts`    | Deterministic simulated operations data + metrics                  |
| `validation.ts`      | Request schemas and a safe parse helper                            |
| `rate-limit.ts`      | In-memory sliding-window limiter                                   |
| `security.ts`        | CSP construction and nonce generation                              |
| `http.ts`            | JSON/error responses and client-IP extraction                      |
| `stream.ts`          | Generator → streaming HTTP response with clean pre-stream failures |
| `response-stream.ts` | Client-side fetch + Web Streams decoding                           |
| `logger.ts`          | Structured, server-only logging sink                               |

## Streaming model

The AI endpoints return `text/plain` token streams. `streamTextResponse` awaits
the first chunk eagerly, converting pre-stream failures (auth, quota,
misconfiguration) into a clean JSON `502` rather than a broken stream. On the
client, `useTextStream` reads the stream via `readTextChunks` and appends tokens
to a live region.

## Determinism & testability

The simulated data is seeded (mulberry32), so the same seed yields the same
snapshot — the UI feels live while tests stay reproducible. Gemini has a mock
mode (`STADIUM_AI_MOCK`) so tests and offline demos never hit the network. The
result is a suite that enforces 100% coverage with no flakiness and no leaked
error output.
