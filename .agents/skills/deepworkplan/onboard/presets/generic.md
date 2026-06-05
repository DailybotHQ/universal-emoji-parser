# Preset — Generic fallback (any unrecognized stack)

> The safety net. When none of the specific presets match (Go, Rust, Ruby/Rails,
> Java/Kotlin, PHP/Laravel, .NET, Elixir, a polyglot or unusual repo, or a
> mostly-data/docs repo), reason **from first principles**. This guide guarantees
> `onboard` never fails on an unknown stack — it produces a minimally-correct but
> **real** standard, never a generic stub.

## The reasoning method (apply to any stack)

1. **Find the manifest(s) and lockfile(s).** `go.mod`, `Cargo.toml`, `Gemfile`,
   `composer.json`, `pom.xml`/`build.gradle`, `*.csproj`/`*.sln`, `mix.exs`,
   `pyproject.toml`, `package.json`, etc. The manifest tells you the language,
   the dependency set, and usually the entry points. The lockfile tells you the
   real package manager.
2. **Find the real build/test/lint/run commands.** Look, in order, at: the
   manifest's task/script section (e.g. `Cargo` subcommands, `go` subcommands,
   `composer scripts`, Gradle tasks), a `Makefile`/`Taskfile.yml`/`justfile`, CI
   workflows (`.github/workflows/*`, `.gitlab-ci.yml`), and any `docker.sh`/
   `docker-compose.yml`. Capture the **exact** commands; flag any that are
   CI-only or container-only.
3. **Find the source roots and modules.** Inspect the tree for the conventional
   source dirs of the language (`src/`, `cmd/`+`pkg/` for Go, `lib/` for Ruby,
   `app/` for Rails/Laravel, etc.). The major subfolders become per-module docs.
4. **Find the test convention.** Locate existing tests and copy their real
   naming + framework (`*_test.go`, `*_spec.rb`, `*Test.java`, `#[test]` in
   Rust, etc.) and where they live.
5. **Find the deployment/runtime shape.** Binary? Service? Library? Static
   output? This shapes `ARCHITECTURE.md` and `PERFORMANCE.md`.
6. **Carry forward existing conventions** — README, contributing guide, linter
   config, commit style. Never override a working convention with a generic one.

> Detected reality always wins. If you can identify the language but not a
> command, **ask the developer** for the canonical build/test/lint command
> rather than guessing — never write a placeholder.

## What to generate

- **Skills/agents/commands:** generic-but-**accurate** ones grounded in what you
  found — e.g. a `module`/`feature` skill, a `test` skill (using the repo's real
  test command), and the baseline agent personas (`reviewer`, `architect`,
  `executor`, `debugger`, `qa`, `perf-optimizer`, `security-auditor`) plus the
  five DWP commands and `code-review`/`pr`/`commit`. Add a stack-specific skill
  only if you can name a real, repeated task in the repo.
- **Docs:** all the MUST `docs/` categories, each filled with the **real**
  commands, module names, and test pattern you discovered — never an empty stub.
- **Per-module docs:** a `README.md` for each major source folder you found.

## Validation command

There is no preset command here by design — **the whole point is to find the
real one** (step 2). Capture it verbatim into `AGENTS.md` Quick Commands and
`docs/DEVELOPMENT_COMMANDS.md`, and use it for the Phase 8 smoke test.
