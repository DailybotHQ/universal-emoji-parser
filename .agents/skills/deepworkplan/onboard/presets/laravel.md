# Preset — Laravel (PHP)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- `composer.json` with `laravel/framework` in `require`, and an `artisan`
  console entrypoint at the repo root.
- App layout under `app/`: `Models/`, `Http/Controllers/`, `Http/Middleware/`,
  `Providers/`, plus `config/`, `database/migrations/`, `database/seeders/`,
  `resources/`, and `routes/`.
- Routing in `routes/web.php` (session/web) and `routes/api.php` (stateless
  API); console routes in `routes/console.php`.
- Eloquent ORM models, migrations as timestamped classes under
  `database/migrations/`, factories/seeders for test data.
- Frequently containerized via **Laravel Sail**: look for `docker-compose.yml`,
  a `vendor/bin/sail` wrapper, and MySQL/Postgres/Redis services.
- Config and **secrets** in `.env` (driven by `config/*.php` reading `env()`);
  `.env.example` documents the expected keys.

## What to look for in recon

- The **real** test runner: `php artisan test` (wraps PHPUnit/Pest), bare
  `vendor/bin/phpunit`, or `vendor/bin/pest`. Check `phpunit.xml` and whether
  `pestphp/pest` is in `composer.json`. Test layout is commonly
  `tests/Feature/` and `tests/Unit/`.
- The **real** lint/format/static-analysis gate: `vendor/bin/pint` (Laravel
  Pint), PHP-CS-Fixer, and `vendor/bin/phpstan` / Larastan. Confirm which are
  wired and whether a composer script (`composer test`, `composer lint`) wraps
  them.
- Migration workflow (`php artisan migrate`, `migrate:fresh --seed`) and whether
  it runs inside Sail/Docker.
- Whether queues/jobs (`app/Jobs/`), events/listeners, scheduled tasks
  (`app/Console/Kernel.php` schedule), or Livewire/Inertia front-ends are present.

## Stack-specific skills/agents/commands to generate

- Skills: `model` (Eloquent model + migration + factory), `migration`
  (make/apply migrations safely), `controller` (controller + route + request
  validation), `artisan-command` (console command), optionally `job`/`queue`
  and `eloquent-relation` if those patterns are present.
- Agents: baseline roles + a `migration-author` / `db-reviewer` persona aware
  of migration reversibility and mass-assignment/`$fillable` safety.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — request → route → middleware → controller → Eloquent flow,
  service/repository layering, queues/events, caching/Redis, the DB.
- `TESTING_GUIDE.md` — PHPUnit vs Pest, feature vs unit tests, factories and
  database refresh strategy (`RefreshDatabase`), how to scope a single test.
- `SECURITY.md` — `.env`/config secrets handling, auth model (sessions,
  Sanctum, Passport), mass-assignment and validation boundaries, CSRF.
- Per-module docs: one per bounded area (its models, controllers, routes, jobs,
  policies).

## Typical validation command (FIND the real one)

Often `php artisan test` plus `vendor/bin/pint --test` and/or
`vendor/bin/phpstan analyse`, sometimes wrapped in a composer script and run
**inside Sail** (`./vendor/bin/sail test`). **Do not assume** — read
`composer.json` scripts, `phpunit.xml`, and CI, and capture the exact command,
flagging if it runs inside Docker.
