# Preset — Ruby on Rails (Ruby)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- A `Gemfile` declaring `rails` (and `Gemfile.lock` pinning it), `bin/rails` and
  `bin/rake` executables, and `config/application.rb` requiring `rails/all`.
- The MVC layout under `app/`: `app/models`, `app/controllers`, `app/views`,
  plus `app/helpers`, `app/jobs`, `app/mailers`, and (modern) `app/javascript`.
- Routing in `config/routes.rb`; the database layer in `db/migrate/*` migrations
  and `db/schema.rb` (or `db/structure.sql`).
- Configuration under `config/` (`environments/{development,test,production}.rb`),
  and encrypted secrets in `config/credentials.yml.enc` + `config/master.key`.
- Test framework from what's present: **RSpec** (`spec/`, `.rspec`,
  `rspec-rails` in the Gemfile) **or** Minitest (`test/`, the Rails default).
  **Infer from what exists.**

## What to look for in recon

- The **real** test command: `bundle exec rspec` (RSpec) or `bin/rails test`
  (Minitest), plus system/integration variants (`bin/rails test:system`).
  Confirm the directory (`spec/` vs `test/`) and any factories
  (`factory_bot`) vs fixtures.
- The **real** lint/format gate: `rubocop` (often `bundle exec rubocop`,
  `.rubocop.yml`), Standard, or `erb_lint`/`brakeman` — capture how it's
  invoked.
- The migration workflow (`bin/rails db:migrate`, `db:rollback`,
  `db:schema:load`) and whether the schema is `schema.rb` or `structure.sql`.
- Background jobs (Active Job adapter: Sidekiq/Resque/GoodJob), and the
  front-end approach (Hotwire/Turbo + Stimulus, importmaps/jsbundling,
  ViewComponent).
- Where secrets/config live: `config/credentials*`, `Rails.application.config`,
  `ENV`, and the multi-environment layout.

## Stack-specific skills/agents/commands to generate

- Skills: `model-add` (model + migration + spec), `migration` (write/apply a
  migration safely), `controller` (controller + routes + request spec),
  `endpoint`/`resource` (resourceful route + controller + view/JSON),
  optionally `job` (Active Job) and `mailer` if present.
- Agents: baseline roles + a `migration-author` / `db-reviewer` persona aware of
  reversible migrations and zero-downtime concerns.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — request → route → controller → model → view/serializer
  flow, Active Record associations, jobs/mailers, Hotwire/Turbo if present.
- `TESTING_GUIDE.md` — RSpec vs Minitest, model/request/system specs, factories
  vs fixtures, how to run a single spec/test file.
- `SECURITY.md` — `config/credentials` + `master.key` handling, strong
  parameters, CSRF, auth (Devise/has_secure_password), Brakeman.
- Per-module docs: per domain area (its models, controllers, jobs, mailers).

## Typical validation command (FIND the real one)

Often `bundle exec rubocop && bundle exec rspec`, or `bin/rails test` for a
Minitest app. **Do not assume** the test framework or lint setup — read the
`Gemfile`, `.rubocop.yml`, `bin/`, and CI, and capture the exact command.
