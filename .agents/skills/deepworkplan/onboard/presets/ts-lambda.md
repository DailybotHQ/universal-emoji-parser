# Preset — TS Lambda (Serverless) (Serverless Framework / SAM / CDK)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- A deploy descriptor — exactly which one shapes the whole flow:
  - `serverless.yml` → **Serverless Framework** (`functions:` map, `provider:`,
    plugins like `serverless-esbuild`).
  - `template.yaml`/`template.yml` with `Transform: AWS::Serverless-2016-10-31`
    → **AWS SAM**.
  - `cdk.json` + a `bin/`/`lib/` stack tree → **AWS CDK** (functions defined in
    TypeScript constructs).
- `tsconfig.json` plus `aws-lambda` types; handler files exporting `handler`
  (e.g. `export const handler = async (event) => ...`).
- Per-function layout under `src/functions/` or `src/handlers/`, often one
  directory per function. Bundler config: `esbuild`/`esbuild.config`, or `tsc`.
- Package manager from the lockfile (pnpm/yarn/npm). **Infer the toolchain
  (Serverless vs SAM vs CDK) from the descriptor that's present** — do not assume.

## What to look for in recon

- The **real** scripts: lint (`eslint`), type-check (`tsc --noEmit` /
  `type:check`), test (`jest`/`vitest`), and the bundle step (esbuild vs tsc).
  Test convention is usually `*.test.ts`/`*.spec.ts` colocated or under `tests/`.
- The **real** package/synth command — the safe, read-only gate:
  `sls package` (Serverless), `sam build` (+ `sam validate`), or `cdk synth`.
  **`sls deploy` / `sam deploy` / `cdk deploy` mutate the AWS account — never run
  them as a validation gate.**
- Event sources per function (API Gateway/HTTP, SQS, SNS, EventBridge, S3,
  DynamoDB streams) — this shapes the handler skill and the event types.
- **IAM scope per function** (least privilege), cold-start/bundle-size budget,
  and where secrets/config live (SSM Parameter Store, Secrets Manager, env vars).

## Stack-specific skills/agents/commands to generate

- Skills: `lambda-fn` (new handler + typed event + unit test + descriptor
  wiring), `event-source` (wire a trigger to a function), `iam-policy` (scope a
  least-privilege role), optionally `layer` (shared Lambda layer) and
  `local-invoke` (run a function locally via `sls invoke local`/`sam local`).
- Agents: baseline roles + a `security-reviewer` / `iam-auditor` persona focused
  on least-privilege IAM, and an `api-reviewer` for contract/error handling.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — event lifecycle per function, the toolchain (Serverless /
  SAM / CDK), function topology and their triggers, shared layers/utilities.
- `SECURITY.md` — **least-privilege IAM per function** (call this out
  explicitly), secrets handling (SSM/Secrets Manager, never hard-coded),
  input validation at the event boundary, the sensitive-data boundary.
- `PERFORMANCE.md` — cold starts, bundle size (tree-shaking via esbuild),
  memory/timeout tuning, provisioned concurrency, connection reuse.
- Per-module docs: one per function (its event source, IAM role, dependencies).

## Typical validation command (FIND the real one)

Often `npm run lint && tsc --noEmit && npm test && sls package` (or
`sam build && sam validate`, or `cdk synth`). **Do not assume** the toolchain,
package manager, or script names — read `package.json`/the descriptor/CI and
capture the exact commands, treating synth/package (not deploy) as the gate.
