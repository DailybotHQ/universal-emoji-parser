---
name: deepworkplan-addon-dependency-upgrade
description: Optional DeepWorkPlan addon that safely upgrades a repo's dependencies — reasoning about the repo's ACTUAL package manager (npm/pnpm/yarn + ncu, pip/poetry/uv, cargo, go mod, bundler, composer, and more) rather than assuming npm — with a batched, validated, revertible workflow that detects the manager and manifests/lockfiles, classifies upgrades (patch/minor/major), upgrades in safe batches, runs the repo's real validation gate after each batch, reverts a failing batch, and summarizes. Opt-in, never required, reconciles with the repo's existing tooling. Use when the developer wants to bring dependencies up to date without breaking the build.
version: "2.7.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
metadata: {"openclaw":{"emoji":"⬆️","homepage":"https://deepworkplan.com"}}
---

# DeepWorkPlan — Dependency-Upgrade Addon

Safely bring a repo's dependencies up to date with a **batched, validated,
revertible** workflow. This is the methodology's **third opt-in addon** — it is
**never** required for a repo to be AI-first.

> ## The rule that overrides everything: REASON about the package manager, then upgrade
>
> The legacy version of this workflow assumed npm. **It does not.** The first job
> is to **detect the repo's actual package manager from the manifest and lockfile
> that exist** (see `SPEC.md` §2 and `templates/ecosystems.md`), then drive that
> manager's real upgrade and install commands. Never run `ncu`/`pnpm` in a Go,
> Rust, Python, Ruby, or PHP repo. Never assume a lockfile you have not seen.

## Read these first (all relative inside the skill)

- [`SPEC.md`](SPEC.md) — the normative (RFC-2119) contract: detection, semver
  classification, batched-upgrade rule, validate-after-each-batch gate,
  revert-on-failure rule, reconcile-don't-clobber, validation step.
- [`templates/ecosystems.md`](templates/ecosystems.md) — the **per-ecosystem
  reasoning table**: how to detect each manager and its real detect / classify /
  upgrade / install / lockfile commands. Match the row for the detected stack as
  a *checklist*, then verify against the real repo — **detected reality wins**.
- [`templates/upgrade-report.md`](templates/upgrade-report.md) — the report shape
  to summarize what was upgraded, skipped, reverted, and validated.
- [`templates/lib-upgrade-command.md`](templates/lib-upgrade-command.md) — the
  `/lib-upgrade` delegator this addon installs into the target repo's
  `.agents/commands/` **only when accepted**.
- `../README.md` — the addon mechanism (opt-in, reconcile-don't-clobber, contract).

## When this runs

- From **`onboard` Phase 7b** — after the core AI-first scaffolding, `onboard`
  offers this addon; if accepted it reads this SKILL and runs the flow below.
- **Directly** — `/deepworkplan-addon-dependency-upgrade` on an already-onboarded
  repo to upgrade dependencies, or via the installed `/lib-upgrade` delegator.

## The flow

### Step 0 — Consent + clean tree
1. Confirm the developer wants a dependency upgrade (skip silently if declined —
   the repo stays baseline-conformant).
2. **Require a clean (or backed-up) working tree.** Run `git status`; if there
   are uncommitted changes, ask the developer to commit or stash first. A clean
   tree is what makes a batch revertible (Step 4).

### Step 1 — Detect the package manager (the part you MUST reason about)
Detect the manager(s) from the **manifest + lockfile that actually exist**, never
by assuming npm. Use `templates/ecosystems.md`:

- **JS/TS** → `package.json` + which lockfile: `pnpm-lock.yaml` (pnpm),
  `yarn.lock` (yarn), `package-lock.json` (npm). `ncu` is the cross-manager
  version checker; the install/update verb is the detected manager's.
- **Python** → `pyproject.toml` + `poetry.lock` (poetry) / `uv.lock` (uv);
  `requirements*.txt` (pip / pip-tools); `Pipfile.lock` (pipenv).
- **Rust** → `Cargo.toml` + `Cargo.lock` (`cargo update`).
- **Go** → `go.mod` + `go.sum` (`go get -u` / `go get` per module + `go mod tidy`).
- **Ruby** → `Gemfile` + `Gemfile.lock` (`bundle update`).
- **PHP** → `composer.json` + `composer.lock` (`composer update`).

A repo MAY have **more than one** ecosystem (e.g. a JS frontend + a Python
service). Handle each ecosystem with its own manager, in its own batches.

### Step 2 — Classify upgrades (patch / minor / major)
For every outdated dependency, classify by semver against the version in the
manifest/lockfile:

- **patch** `X.Y.Z → X.Y.(Z+1)` — safest (bug fixes).
- **minor** `X.Y.Z → X.(Y+1).0` — usually safe (additive, backward-compatible).
- **major** `X.Y.Z → (X+1).0.0` — breaking changes possible.

Group **patch + minor** as the auto-batchable set. **Majors require explicit
developer approval** before inclusion (present them and wait). Upgrade tightly
coupled packages **together** (e.g. `typescript` + its plugins; a framework + its
companion packages) so a peer-dependency constraint is not split across batches.

### Step 3 — Upgrade in safe batches
Apply upgrades in **small, coherent batches** — never all at once (that makes a
failure impossible to isolate). A reasonable order: patch batch → minor batch →
each approved major **on its own**. For each batch, run the detected manager's
**update-manifest + install** commands (e.g. `ncu -u --target minor` then the
manager's install; `cargo update -p <crate>`; `go get <module>@latest`;
`poetry update <pkg>`; `bundle update <gem>`; `composer update <pkg>`). The
lockfile is regenerated by the manager — never hand-edit it.

### Step 4 — Validate after EACH batch (the gate)
After every batch, run the **repo's real validation gate** — the commands the
repo actually uses, discovered from `AGENTS.md` Quick Commands /
`docs/DEVELOPMENT_COMMANDS.md` / the manifest's scripts, or the devcontainer's
`codecheck`/`check`/`fix`/`test` aliases if that addon is present. Examples:
`pnpm run biome:check && pnpm run astro:check && pnpm run build`;
`ruff check && mypy && pytest`; `cargo test`; `go build ./... && go test ./...`;
`bundle exec rspec`; `composer test`. **Never invent a gate** — use the repo's
real one.

### Step 5 — Revert a failing batch
If the gate fails for a batch, **revert just that batch** and continue:
restore the manifest **and** lockfile (`git checkout -- <manifest> <lockfile>`),
re-run install to resync, confirm the gate passes again, then record the batch as
**skipped/failed** with the reason. Optionally retry the batch one package at a
time to isolate the culprit. A failing major is set aside, not forced.

### Step 6 — Summarize
Produce the report from `templates/upgrade-report.md`: upgraded (by tier),
skipped (with reason), reverted (with the failing gate), the manager(s) used, the
files changed (manifest + lockfile), and recommended follow-ups. **Do not commit
automatically** — surface the diff and let the developer commit (suggest
`chore(deps): …`).

## Failure-mode guardrails

- **Never required, never blocking.** If the developer declines, stop cleanly.
- **Reason about the manager.** Never run npm/ncu in a non-JS repo; never assume a
  lockfile you have not seen.
- **Never all-at-once.** Batch so a failure is isolable and revertible.
- **Real gate only.** Validate with the repo's actual commands, never a guess.
- **Revert, don't push through.** A failing batch is reverted and recorded, never
  force-installed past a broken gate.
- **Don't hand-edit lockfiles.** The manager owns them; regenerate via install.
- **Don't auto-commit.** Surface the diff; the developer commits.
