# Contributing

Thanks for your interest in improving Stadium Pulse.

## Development setup

```bash
nvm use            # Node 22 (see .nvmrc)
npm install
cp .env.example .env.local   # set GEMINI_API_KEY or STADIUM_AI_MOCK=true
npm run dev
```

## Quality gate

Every change must pass the full local gate before it is pushed:

```bash
npm run verify     # format:check → lint → typecheck → test:coverage → build
npm run e2e        # end-to-end (Playwright)
```

- **Coverage is enforced at 100%** (statements, branches, functions, lines).
  New code needs matching tests.
- **No leaked error output.** Tests must not print stack traces or error logs;
  mock server-side logging where a failure path is exercised.
- **Accessibility.** New UI must pass the `jest-axe` checks and keep semantic
  markup, labelled controls, and keyboard support.

## Conventions

- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/):
  `type(scope): subject` (e.g. `feat(assistant): add locale hint`).
- **TypeScript** is strict; avoid `any` and prefer small, pure functions.
- **Formatting** is owned by Prettier; run `npm run format`.
- Keep secrets out of the repo and out of client code.

## Pull requests

Fill in the PR template (What / Why / How tested). CI runs the same gate plus
CodeQL; all checks must be green before merge.
