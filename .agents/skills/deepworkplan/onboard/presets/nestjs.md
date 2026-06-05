# Preset — NestJS (TypeScript)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- `nest-cli.json` at the repo root and `@nestjs/core`, `@nestjs/common` in
  `package.json` deps; usually `reflect-metadata` and `rxjs`.
- A bootstrap `main.ts` calling `NestFactory.create(AppModule)`; a root
  `app.module.ts`.
- The decorator + DI model: `@Module`, `@Controller`, `@Injectable`, plus
  `@Get/@Post/...` route decorators and constructor injection.
- Feature folders, each with `*.module.ts`, `*.controller.ts`, `*.service.ts`,
  and `dto/` (request/response DTOs, often `class-validator`/`class-transformer`).
- Cross-cutting providers: guards, pipes (`ValidationPipe`), interceptors,
  filters, and `@nestjs/config` for configuration.
- Package manager from the lockfile (`pnpm-lock.yaml` → pnpm, `yarn.lock` →
  yarn, `package-lock.json` → npm). **Infer from what's present.**
- Common companions: TypeORM/Prisma/Mongoose, `@nestjs/swagger`, microservices
  (`@nestjs/microservices`), or GraphQL (`@nestjs/graphql`).

## What to look for in recon

- The **real** scripts in `package.json`: `test` (Jest unit), `test:e2e` (Jest
  via `test/jest-e2e.json`), `test:cov`, `lint` (ESLint), `build` (`nest build`
  / `tsc`), and `start:dev`. Capture them verbatim.
- Test convention: unit tests are `*.spec.ts` co-located with sources; e2e tests
  are `*.e2e-spec.ts` under `test/`, using `@nestjs/testing`'s
  `Test.createTestingModule(...)` and supertest.
- Module graph: how feature modules import/export providers and are wired into
  `AppModule`; which providers are global.
- Validation/serialization strategy: a global `ValidationPipe`, DTOs with
  `class-validator` decorators, and any interceptors/serializers.
- The ORM/data layer and migration workflow (TypeORM migrations vs Prisma
  `migrate`), and where config/secrets live (`@nestjs/config`, `.env`).

## Stack-specific skills/agents/commands to generate

- Skills: `module-add` (feature module scaffold + wiring into `AppModule`),
  `controller` (controller + route handlers + spec), `provider`/`service`
  (injectable service + spec), `dto` (request/response DTO with validation),
  optionally `guard`/`pipe`/`interceptor` and `migration` if an ORM is present.
- Agents: baseline roles + an `api-reviewer` / `module-author` persona aware of
  DI scope, DTO validation, and module boundaries.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — module graph and DI, request → guard → pipe → controller →
  service → repository flow, interceptors/filters, transport (HTTP/microservice/
  GraphQL).
- `TESTING_GUIDE.md` — Jest unit `*.spec.ts` with `Test.createTestingModule` and
  provider mocking, e2e `*.e2e-spec.ts` with supertest, how to scope one
  module's tests.
- `SECURITY.md` — auth guards/strategies (`@nestjs/passport`, JWT), global
  `ValidationPipe`, secrets via `@nestjs/config`.
- Per-module docs: one per feature module (its controllers, providers, DTOs).

## Typical validation command (FIND the real one)

Commonly `<pm> run lint && <pm> test && <pm> run build` (e.g. `pnpm`/`npm`),
sometimes with `test:e2e`. **Do not assume the package manager or script
names** — read `package.json`/CI and capture the exact commands.
