# Security Policy

Security is a first-class design goal of Stadium Pulse. This document describes
the controls in place and how to report issues.

## Reporting a vulnerability

Please open a private security advisory on the repository, or contact the
maintainers directly. Do not open a public issue for undisclosed
vulnerabilities. We aim to acknowledge reports within 72 hours.

## Secret handling

- `GEMINI_API_KEY` is **server-only**. It has no `NEXT_PUBLIC_` prefix and is
  read exclusively in modules that import [`server-only`](lib/gemini.ts), so a
  build fails if such code is ever pulled into a client bundle.
- No secrets are committed. `.env*` is git-ignored; [`.env.example`](.env.example)
  documents configuration with empty values.
- Environment variables are validated with Zod at startup
  ([`lib/env.ts`](lib/env.ts)). Invalid configuration throws a **value-free**
  error naming only the offending keys.

## Input validation & abuse prevention

- Every request body is validated against a strict Zod schema
  ([`lib/validation.ts`](lib/validation.ts)): bounded message length, allow-listed
  fields (`.strict()`), and pattern-checked identifiers.
- Request bodies are **size-capped** before parsing ([`lib/api-guard.ts`](lib/api-guard.ts)),
  returning `413` on oversized payloads — checked against both the declared
  `Content-Length` and the actual bytes read.
- All AI endpoints are **rate-limited** per client IP
  ([`lib/rate-limit.ts`](lib/rate-limit.ts)), returning `429` with `Retry-After`.
  The client key uses the **rightmost** `x-forwarded-for` entry (appended by the
  nearest trusted proxy), so clients cannot rotate buckets with forged headers,
  and fully-expired keys are swept to bound memory under key-rotation abuse.
- Upstream AI calls that gate page rendering are **time-boxed**
  ([`lib/ops-source.ts`](lib/ops-source.ts)); on timeout the app degrades to a
  procedural snapshot instead of hanging.
- Client-facing errors are **generic**; internal details are logged server-side
  only ([`lib/logger.ts`](lib/logger.ts)).

## Transport & browser hardening

Set in [`proxy.ts`](proxy.ts) and [`next.config.ts`](next.config.ts):

| Header                       | Value                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `Content-Security-Policy`    | Per-request nonce, `strict-dynamic`, `object-src 'none'`, `frame-ancestors 'none'` |
| `Strict-Transport-Security`  | `max-age=63072000; includeSubDomains; preload`                                     |
| `X-Content-Type-Options`     | `nosniff`                                                                          |
| `X-Frame-Options`            | `DENY`                                                                             |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                                                  |
| `Permissions-Policy`         | camera/microphone/geolocation/browsing-topics disabled                             |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                                      |

The `X-Powered-By` header is disabled.

## Output safety & prompt injection

- AI output is rendered as **plain text** in `aria-live` regions. The codebase
  uses no `dangerouslySetInnerHTML`, eliminating that XSS vector.
- System prompts instruct the model to ignore attempts to change its role or
  reveal instructions, and the operations prompt is told to ignore instructions
  embedded in the data payload ([`lib/gemini.ts`](lib/gemini.ts)). Prompt
  injection cannot be fully eliminated; user-supplied text is never executed and
  the model has no tools or privileged access.

## Supply chain

- **Dependabot** ([`.github/dependabot.yml`](.github/dependabot.yml)) keeps npm
  and GitHub Actions dependencies patched.
- **CodeQL** ([`.github/workflows/codeql.yml`](.github/workflows/codeql.yml))
  scans for vulnerable code patterns.
- `npm audit` runs in CI; the dependency tree currently reports **0 known
  vulnerabilities**.
