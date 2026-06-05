# Preset — Angular (TypeScript)

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `angular.json` at the repo root and `@angular/core` in `package.json`
  `dependencies` (Angular version → `@angular/*@^N`).
- `src/app/` with components decorated `@Component({ selector, template/
  templateUrl, styleUrls })`, and either `@NgModule` declarations
  (`app.module.ts`) or **standalone components** (`standalone: true`,
  `bootstrapApplication`, `app.config.ts`). **Confirm which the app uses.**
- Services decorated `@Injectable({ providedIn: 'root' })`, RxJS (`rxjs` in
  deps, `Observable`/`Subject`/`pipe`), and `@angular/router` for routing.
- `@angular/cli` / `ng` available; `tsconfig.json` plus `tsconfig.app.json` /
  `tsconfig.spec.json` splits.
- Package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` →
  yarn, `package-lock.json` → npm. **Infer from the lockfile present.**
- Layout: `src/app/` with feature folders, `components/`, `services/`, `models/`,
  `guards/`, `*.module.ts`/`*.routes.ts`; possibly an Nx workspace (`nx.json`,
  `project.json`, `libs/`/`apps/`).

## What to look for in recon

- The **real** test runner: Karma + Jasmine (`karma.conf.js`, `*.spec.ts`,
  `ng test`) vs Jest (`jest.config.*`, `@angular-builders/jest` or `jest-preset-
  angular`, `*.spec.ts`). **Confirm which from the config that exists.**
- The **real** lint gate: `ng lint` backed by `@angular-eslint` (`.eslintrc` /
  `eslint.config.js`), and any Prettier step. Capture verbatim.
- The **real** build: `ng build` (and `ng build --configuration production`),
  and whether SSR/`@angular/ssr` or `@angular/universal` is in play.
- NgModules vs standalone: drives whether new features need a module entry or a
  `providers`/`imports` array on the component/route.
- State management if present: NgRx (`@ngrx/store`, effects, selectors),
  signals (`signal()`, `computed()`), or plain services-with-subjects.

## Stack-specific skills/agents/commands to generate

- Skills: `component` (component + template + spec), `service` (injectable +
  spec), `module` or `standalone-feature` (depending on the app style),
  `guard`/`resolver`, and `ngrx-feature` (store + effects + selectors) if NgRx
  is present.
- Agents: baseline + a `component-author` / `frontend-reviewer` persona aware of
  change detection (OnPush), the smart-vs-presentational split, and RxJS
  subscription/teardown hygiene.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — module/standalone structure, routing, DI tree, RxJS data
  flow, state management (NgRx/signals), HTTP/interceptor layer.
- `STANDARDS.md` — component/service conventions, OnPush change detection,
  subscription teardown (`takeUntilDestroyed`/`async` pipe), smart-vs-dumb split.
- `TESTING_GUIDE.md` — Karma/Jasmine vs Jest, `TestBed` setup, `HttpTestingController`,
  the real `*.spec.ts` pattern, how to scope one feature's tests.
- Per-module docs: one per feature module / standalone feature (its components,
  services, routes, guards).

## Typical validation command (FIND the real one)

Commonly `ng lint && ng test --watch=false --browsers=ChromeHeadless && ng
build`, or wrapped `package.json` scripts (`npm run lint && npm run test:ci &&
npm run build`). **Do not assume** the package manager, the test runner, or the
script names — read `angular.json`, `package.json`, and CI and capture the exact
commands.
