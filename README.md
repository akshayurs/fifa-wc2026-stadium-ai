# Stadium Pulse — GenAI Stadium Operations & Fan Assistant

> A GenAI-powered command center that **optimizes stadium operations** and
> **enhances the FIFA World Cup 2026 fan experience** through **intelligent,
> real-time assistance** — powered by Google Gemini.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Tests](https://img.shields.io/badge/tests-135%20passing-brightgreen.svg)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)

---

## The problem

> _Create a GenAI-powered solution to optimize stadium operations and enhance
> the FIFA World Cup 2026 experience through intelligent, real-time assistance._

Match days at a World Cup venue generate two simultaneous pressures: **operators**
must keep 80,000+ people flowing safely through gates, concourses, and zones,
while **fans** need instant, reliable answers about where to go and what is
available. Stadium Pulse addresses both with a single Gemini-powered surface.

## Requirement → feature traceability

| Problem-statement requirement   | How Stadium Pulse delivers it                                                        | Key source                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **GenAI-powered**               | Google Gemini via the official `@google/genai` SDK, called server-side only          | [`lib/gemini.ts`](lib/gemini.ts)                                                                                      |
| **Optimize stadium operations** | Ops Command Center + an AI briefing that turns live metrics into prioritized actions | [`components/OpsDashboard.tsx`](components/OpsDashboard.tsx), [`app/api/ops-briefing`](app/api/ops-briefing/route.ts) |
| **Enhance the fan experience**  | Streaming fan Assistant for wayfinding, gates, concessions, accessibility, transit   | [`components/AssistantPanel.tsx`](components/AssistantPanel.tsx), [`app/api/assistant`](app/api/assistant/route.ts)   |
| **Real-time**                   | Per-request, Gemini-generated operations snapshot + token-streamed AI responses      | [`lib/ops-source.ts`](lib/ops-source.ts), [`lib/stream.ts`](lib/stream.ts)                                            |
| **Intelligent assistance**      | Hardened, grounded system prompts for both fan and operator personas                 | [`lib/gemini.ts`](lib/gemini.ts)                                                                                      |
| **FIFA World Cup 2026**         | Tournament-specific content and prompts; no hardcoded operational dataset            | [`lib/constants.ts`](lib/constants.ts), [`lib/ops-source.ts`](lib/ops-source.ts)                                      |

## Features

- **Operations Command Center** — live occupancy per zone, gate throughput and
  wait times, and an incident feed, with an overall status indicator.
- **AI Operations Briefing** — Gemini summarizes the live snapshot into a short
  situation assessment plus concrete, prioritized recommendations.
- **Fan Assistant** — a streaming chat for wayfinding, seating, concessions,
  accessibility services, and transit.
- **Accessible by design** — semantic landmarks, skip link, keyboard support,
  live regions, and WCAG-AA contrast in light and dark themes.
- **No hardcoded data** — the operations snapshot is generated at runtime by
  Gemini as structured JSON, with a computed procedural fallback for offline/CI.

## Tech stack

- **Next.js 16** (App Router, React Server Components) + **React 19** + **TypeScript** (strict)
- **Google Gemini** (`@google/genai`), streamed server-side
- **Zod** for environment and request validation
- **Tailwind CSS v4** with theme-aware, contrast-checked tokens
- **Vitest** + **Testing Library** + **jest-axe** (unit, integration, a11y) and **Playwright** (E2E)

## Architecture at a glance

```
Browser ──▶ proxy.ts (per-request CSP nonce, strict security headers)
        └─▶ app/page.tsx (RSC dashboard)  ─▶ components/* (client panels)
                                              │  fetch (stream)
                                              ▼
                              app/api/{assistant,ops-briefing}/route.ts
                                rate-limit → validate → stream
                                              │
                                              ▼
                              lib/gemini.ts ─▶ Google Gemini (key server-only)
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for details.

## Getting started

Prerequisites: **Node 20.11+** (see [`.nvmrc`](.nvmrc)) and npm 10+.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   add your Gemini API key, or set STADIUM_AI_MOCK=true to run without one

# 3. Run the dev server
npm run dev            # http://localhost:3000
```

Get a Gemini API key at <https://aistudio.google.com/app/apikey>.

### Run without a key

Set `STADIUM_AI_MOCK=true` in `.env.local` to stream a deterministic canned
response — useful for offline demos, tests, and CI.

## Scripts

| Script                  | Purpose                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Start the development server                                  |
| `npm run build`         | Production build                                              |
| `npm start`             | Serve the production build                                    |
| `npm run lint`          | ESLint (strict + accessibility rules)                         |
| `npm run typecheck`     | TypeScript, no emit                                           |
| `npm run format`        | Format with Prettier                                          |
| `npm run test`          | Unit/integration/a11y tests (Vitest)                          |
| `npm run test:coverage` | Tests with 100% coverage thresholds enforced                  |
| `npm run e2e`           | End-to-end tests (Playwright)                                 |
| `npm run verify`        | Full local gate: format → lint → typecheck → coverage → build |

## Testing

- **Unit / integration**: every module in `lib/`, every API route, and every
  component is tested. Coverage thresholds are set to **100%** for statements,
  branches, functions, and lines ([`vitest.config.ts`](vitest.config.ts)).
- **Accessibility**: `jest-axe` asserts **zero** violations on rendered UI.
- **End-to-end**: Playwright drives the real app in deterministic AI mock mode.
- The `layout.tsx`/`page.tsx` shells compose already-tested children and are
  verified end-to-end by Playwright rather than in unit coverage.

```bash
npm run test:coverage
npm run e2e
```

## Security

Highlights (full policy in [`SECURITY.md`](SECURITY.md)):

- The Gemini API key is **server-only** — never `NEXT_PUBLIC_`, never in the client bundle.
- Environment is validated with Zod and **fails fast** with value-free errors.
- Every request is schema-validated and **rate-limited**; errors are generic to clients and logged server-side only.
- A per-request **nonce-based `strict-dynamic` Content-Security-Policy** plus HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and COOP.
- No `dangerouslySetInnerHTML`; AI output is rendered as text. System prompts are hardened against prompt injection.
- Automated **CodeQL**, **Dependabot**, and `npm audit` in CI.

## Accessibility

Semantic landmarks, a skip link, visible focus indicators, full keyboard
operability, `aria-live` regions for streamed responses, labelled controls,
WCAG-AA contrast in both colour schemes, and respect for
`prefers-reduced-motion`. Enforced by `eslint-plugin-jsx-a11y` and automated
axe tests.

## Deployment (Vercel)

```bash
vercel                       # link/create the project
vercel env add GEMINI_API_KEY production
vercel --prod                # deploy
```

The app deploys as-is on Vercel; security headers and the proxy apply
automatically.

## License

[MIT](LICENSE)
