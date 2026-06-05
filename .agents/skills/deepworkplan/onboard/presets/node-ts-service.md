# Preset — Node / TypeScript service (Express / Fastify / Lambda)

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `tsconfig.json` + a server framework in deps: `express`, `fastify`, `koa`,
  `@nestjs/*`, or serverless handlers.
- Serverless shape: `serverless.yml`, `template.yaml` (SAM), `aws-lambda` types,
  handler files exporting `handler`, or a `functions/` directory.
- Long-running service shape: a `start`/`serve` script, a `Dockerfile`, a
  `src/index.ts`/`src/server.ts` entrypoint.
- Package manager from the lockfile (pnpm/yarn/npm) — infer from what's present.
- Layout: `src/` with `routes`/`controllers`/`handlers`, `services`,
  `models`/`schemas`, `middleware`, `lib`.

## What to look for in recon

- The **real** scripts: lint (`eslint:check` / Biome), type-check (`tsc
  --noEmit` / a `type:check` script), test (`jest`/`vitest`), `build`.
- Test convention: usually `*.spec.ts` or `*.test.ts`; where tests live.
- Whether it's **serverless** (per-function handlers, deploy via serverless/SAM)
  or a **long-running service** (HTTP server, container) — this strongly shapes
  `ARCHITECTURE.md`, `PERFORMANCE.md`, and the skills to generate.
- Integrations / external APIs the service talks to; where secrets/config live.

## Stack-specific skills/agents/commands to generate

- Skills: for a service → `endpoint`/`handler` (route + controller + test),
  `service` (business-logic module), `middleware`, `integration` (external API
  client); for serverless → `lambda-fn` (handler + event types + test + deploy
  wiring).
- Agents: baseline + an `api-reviewer` / `integration-author` persona aware of
  contract/versioning and error handling.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — request lifecycle (or event lifecycle for Lambda), service
  boundaries, integration points, error-handling/retry strategy.
- `SECURITY.md` — auth/authz, secrets handling, input validation, the
  sensitive-data boundary.
- `PERFORMANCE.md` — cold starts (serverless), connection pooling, timeouts,
  throughput budgets.
- Per-module docs: per service/handler group and per external integration.

## Typical validation command (FIND the real one)

Commonly `npm run eslint:check && npm test` (or pnpm), plus `tsc --noEmit`.
**Do not assume the package manager or script names** — read `package.json`/CI
and capture the exact commands.
