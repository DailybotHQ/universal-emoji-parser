# onboard/presets — Per-Stack Reasoning Guides

These guides help the `onboard` flow reason about a target repo. There is one
guide per common stack, plus a `generic` fallback for anything unrecognized.

> ## The golden rule
>
> **Presets are reasoning aids, NOT templates.** No file in this folder is a
> thing to copy into the target repo. Each guide lists *signals* that identify a
> stack, *what to generate* (stack-specific skills/agents/commands and doc
> emphases), and the *typical* validation command — and every guide reminds you
> to **verify against the live repo** and prefer **detected reality over preset
> assumptions**. If the preset says one thing and the repo says another, **the
> repo wins**. An empty or generic doc, or a command copied from a preset without
> confirming it exists in the repo, is a **failure**.

## How `onboard/SKILL.md` uses these

- **Phase 1 (recon):** after detecting the stack, load the matching guide and
  use its "signals" + "what to look for" as a checklist, verifying each against
  the real repo.
- **Phases 3–6 (generate):** use the guide's "skills/agents/commands to
  generate" and "doc emphases" as a starting point, then trim/extend based on the
  repo's real needs. Capture the **real** validation command (not the preset's
  example) into `AGENTS.md` and `docs/DEVELOPMENT_COMMANDS.md`.

## Index

| Guide | Stack | Identify by |
|-------|-------|-------------|
| [`django.md`](django.md) | Django / DRF (Python) | `manage.py`, `settings.py`, `poetry`/`pip` |
| [`fastapi.md`](fastapi.md) | FastAPI (Python) | `fastapi`/`uvicorn` in deps, async routes, `APIRouter` |
| [`python-package-cli.md`](python-package-cli.md) | Python package / CLI | `[project.scripts]` / `console_scripts`, Click/Typer |
| [`node-ts-service.md`](node-ts-service.md) | Node/TypeScript service (Express/Fastify/Lambda) | server framework imports, `serverless.yml`/handlers |
| [`nestjs.md`](nestjs.md) | NestJS (TypeScript) | `nest-cli.json`, `@Module`/`@Controller` decorators |
| [`ts-lambda.md`](ts-lambda.md) | TypeScript Lambda (Serverless) | `serverless.yml` / SAM `template.yaml` / CDK, handlers |
| [`spring-boot.md`](spring-boot.md) | Spring Boot (Java/Kotlin) | `pom.xml`/`build.gradle`, `@SpringBootApplication` |
| [`rails.md`](rails.md) | Ruby on Rails | `Gemfile`, `bin/rails`, `app/{models,controllers}` |
| [`laravel.md`](laravel.md) | Laravel (PHP) | `composer.json`, `artisan`, `app/Http/Controllers` |
| [`vue-vite.md`](vue-vite.md) | Vue + Vite (TypeScript) | `vite.config.*`, `vue` in deps |
| [`nuxt.md`](nuxt.md) | Nuxt (Vue) | `nuxt.config.*`, `server/api`, Nitro |
| [`nextjs.md`](nextjs.md) | Next.js (React) | `next.config.*`, `app/` or `pages/` router |
| [`sveltekit.md`](sveltekit.md) | SvelteKit | `svelte.config.js`, `src/routes/+page.svelte` |
| [`angular.md`](angular.md) | Angular | `angular.json`, `@Component`/`@NgModule` |
| [`astro-svelte.md`](astro-svelte.md) | Astro (+ Svelte) static/SSR site | `astro.config.*`, `.astro`/`.svelte` files |
| [`react-native.md`](react-native.md) | React Native (Expo) | `app.json`/`app.config.*`, `expo`/`react-native` deps |
| [`flutter.md`](flutter.md) | Flutter (Dart) | `pubspec.yaml`, `lib/main.dart` |
| [`swift-ios.md`](swift-ios.md) | Swift / iOS | `*.xcodeproj`/`*.xcworkspace`, `Package.swift`, XCTest |
| [`go.md`](go.md) | Go (modules) | `go.mod`, `package main`, `cmd/`/`internal/` |
| [`rust.md`](rust.md) | Rust (Cargo) | `Cargo.toml`, `src/main.rs`/`lib.rs` |
| [`terraform.md`](terraform.md) | Terraform / IaC | `*.tf`, `main.tf`/`variables.tf`/`outputs.tf` |
| [`generic.md`](generic.md) | **Fallback** — any unrecognized stack | none of the above match |

## Archetype note (orchestrator hub)

Presets describe **individual-repo** stacks (the 99% case). If Phase 2 classifies
the target as an **orchestrator hub** (a coordination repo over multiple
sub-repos — `repositories/` folder, mostly-markdown root, sub-repos tracked
separately, root `AGENTS.md` indexing other repos' `AGENTS.md`), do **not** apply
a stack preset to the hub itself. Instead:

- Treat the hub's own content (mostly docs/coordination) with the `generic`
  guide's first-principles reasoning.
- Layer the **hub-only** structure on top of the baseline: a sub-project
  navigation index (e.g. `repositories/README.md`), `ECOSYSTEM_CONTEXT.md` + a
  cross-project standards guide, repository-boundary rules in `AGENTS.md` (commit
  inside each sub-repo, never from the hub root), and the orchestrator/child-DWP
  capability (see `../../guide/GUIDE.md`).
- Each **sub-repo** is onboarded independently with its own matching preset; the
  hub does not document sub-repo internals.

See `ARCHETYPES.md` (Task 2 spec) for the full classification heuristic and the
onboarding-difference matrix.
