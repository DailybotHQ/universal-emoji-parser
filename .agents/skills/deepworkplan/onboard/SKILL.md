---
name: deepworkplan-onboard
description: Make a repository AI-first by reasoning about its stack and archetype, then generating adapted AGENTS.md, docs/, per-module docs, .agents/, and the .claude to .agents symlink. Offers opt-in addons. Use when the developer wants to onboard or AI-enable a repo.
version: "2.5.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# DeepWorkPlan — Onboard

Turn the **target repository** into an **AI-first autopilot repo**: a codebase
whose `AGENTS.md`, `docs/`, per-module docs, `.agents/`, `.claude → .agents`
symlink, and gitignored `.dwp/` give *any* AI agent (Claude Code, Cursor, OpenAI
Codex, Gemini, Copilot, Cline, Windsurf, OpenClaw) enough structured context to
work reliably without per-session human hand-holding.

> ## The one rule that overrides everything: REASON, do not copy-paste
>
> This flow is **not** a template copier and **not** a scaffolder. Its entire
> value is that you **inspect the actual target repo** — its real languages,
> frameworks, package manager, build/test/lint commands, folder layout, test
> convention, deployment shape — and then **generate artifacts adapted to that
> repo**. The *shape* of the output is fixed (the ~90%: `AGENTS.md`, the `docs/`
> categories, per-module docs, `.agents/`, the symlinks, `.dwp/`); the *content*
> is reasoned per repo (the ~10%: validation commands, paths, stack-specific
> skills, example plans).
>
> **An empty doc, a generic stub, a placeholder command, or a doc copied
> verbatim from this skill or another repo is a FAILURE.** Never write
> `<your test command here>`. Never write `npm test` unless you confirmed the
> repo uses npm and has a `test` script. Find the *real* command and write it.
> If you cannot determine a real value, ask the developer — do not guess and do
> not leave a placeholder.

## Shared resources — READ THESE FIRST

- [`../shared/context.sh`](../shared/context.sh) — resolve the target repo root,
  branch, agent tool, and the `.dwp/` output location (`dwp_dir`). Run it; do
  not reinvent detection.
- [`../shared/adaptation.md`](../shared/adaptation.md) — the
  reasoning-over-copy-paste principle and the two archetypes. This sub-skill is
  its deep elaboration.
- [`../shared/dwp-paths.md`](../shared/dwp-paths.md) — the `.dwp/` output
  convention you scaffold in Phase 7.
- [`presets/README.md`](presets/README.md) — the per-stack **reasoning guides**
  spanning backend/API (Django, FastAPI, Rails, Spring Boot, Laravel, NestJS),
  frontend (Vue/Vite, Next.js, SvelteKit, Nuxt, Angular, Astro/Svelte), mobile
  (React Native, Flutter, Swift/iOS), and systems/infra (Go, Rust, Terraform,
  TypeScript Lambda, Node/TS service, Python package/CLI), plus a `generic`
  fallback and the orchestrator-hub note. See `presets/README.md` for the full
  index. Read the matching preset in Phase 1 and use it in Phases 3–6.
  **Presets are reasoning aids, not templates.**
- [`../guide/GUIDE.md`](../guide/GUIDE.md) — the DWP methodology you reference
  when wiring the skill and (for hubs) the orchestrator/child-DWP capability.

> **Ship purity:** every path this flow references is relative inside
> `skills/deepworkplan/` (`../shared/*`, `presets/*`, `../guide/GUIDE.md`,
> `../addons/*`). Never reference any absolute host path or any
> `.agent_commands/...` path. The output you write lives in the **target repo**,
> at paths relative to its root.

---

## The generated outcome (what success looks like in the target repo)

When this flow finishes, the target repo contains:

1. **`AGENTS.md`** — index + mandatory rules + a Quick Commands block with the
   repo's **real, runnable** commands; plus `CLAUDE.md → AGENTS.md`.
2. **`docs/`** — the standard categories, each filled with **real**
   repo-specific content (real commands, real module names, real test pattern):
   `PRODUCT_SPEC.md` (the non-technical product/why doc — **required for every
   repo, libraries included**), `ARCHITECTURE.md`, `STANDARDS.md`,
   `TESTING_GUIDE.md`, `DEVELOPMENT_COMMANDS.md`, `SECURITY.md`, `PERFORMANCE.md`,
   `AI_AGENT_ONBOARDING.md`, `AI_AGENT_COLLAB.md`, optional
   `PR_REVIEW_WORKFLOW.md` / `ECOSYSTEM_CONTEXT.md`, and a `docs/README.md`
   index.
3. **Per-module nested docs** — a `README.md` (and a `docs/` subfolder for
   complex modules) inside each major source module discovered in recon.
4. **`.agents/`** — reasoned `agents/`, `commands/`, `skills/`, `docs/`
   (`skills_agents_catalog.md` + `COMMANDS_REFERENCE.md`), `settings.json`, and
   the `.claude → .agents` symlink. Skills/agents/commands are
   **stack-appropriate**, not generic boilerplate.
5. **DeepWorkPlan skill installed** + a gitignored **`.dwp/`** scaffold
   (`.dwp/plans/`, `.dwp/drafts/`, with READMEs and a `.gitignore` rule).

Plus, opt-in (Phase 7b): any accepted **addons** (the first is devcontainer).

---

# The flow — Phases 0–8

Run the phases in order. Write your working notes to `.dwp/onboard/RECON.md` as
you go so generation is auditable and resumable. Treat every "detect" step as
**reason about the real repo**, never assume.

## Phase 0 — Preconditions & consent

1. **Resolve context.** Run `bash ../shared/context.sh` to get `repo_root`,
   `branch`, `agent_tool`, and `dwp_dir`. All target-repo paths below are
   relative to `repo_root`.
2. **Detect fresh-empty vs existing.** Decide which case you are in:
   - **Fresh-empty** — little/no source, no VCS history, no `AGENTS.md` /
     `CLAUDE.md` / `docs/` / `.agents/`. You generate from a clean slate (still
     reasoning from whatever signals exist — e.g. a single `package.json`).
   - **Existing** — real source code and/or any of the above already present.
     You must be **idempotent and non-destructive** (see below).
3. **Non-destructive rule (existing repos).** You **MUST NOT** clobber a
   hand-written `AGENTS.md`, `CLAUDE.md`, `docs/`, `.agents/`, or `.gitignore`.
   For each artifact that already exists: prefer to **merge/augment**; if a
   destructive change is unavoidable, **back it up** (e.g. `AGENTS.md.bak`) and
   **ask the developer first**. Re-running the flow on an
   already-onboarded repo MUST be safe — detect what already conforms and only
   fill gaps.
4. **Consent before writing.** This flow mutates the developer's repo. Present
   the **planned change set at a high level** (archetype guess, detected stack,
   the list of files/folders you intend to create or modify) and get explicit
   confirmation before writing anything.
5. **Honor dry-run / plan-only.** If the developer passes `--dry-run`, says
   "just show me the plan", or declines to write, produce the full plan (recon +
   intended change set) **without writing** any repo files. You MAY still write
   `.dwp/onboard/RECON.md` as the plan artifact, after telling them.

## Phase 1 — Repo reconnaissance (REASON, don't assume)

Inspect the real repo and record findings in `.dwp/onboard/RECON.md`. This is
the **highest-value** phase — everything downstream is reasoned from here.

Detect, by reading actual files (not by habit):

- **Languages & frameworks.** Manifests:
  `pyproject.toml` / `poetry.lock` / `requirements.txt` / `setup.cfg`,
  `package.json` / `pnpm-lock.yaml` / `yarn.lock` / `package-lock.json`,
  `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json`, `pom.xml`, `*.csproj`.
  Framework signatures: `manage.py`+`settings.py` → Django; `vite.config.*` +
  `vue`/`react` in deps → Vue/React + Vite; `astro.config.*` → Astro;
  `next.config.*` → Next; Express/Fastify imports → Node service; Lambda
  handlers / `serverless.yml` / `template.yaml` → serverless; a `console_scripts`
  / `[project.scripts]` entry + Click/Typer/argparse → Python CLI.
- **Build / test / lint / typecheck commands — the crown jewels.** Read the
  manifest scripts (`package.json` `scripts`, `pyproject.toml` tool config),
  `Makefile`, `Taskfile.yml`, `tox.ini`, CI workflows (`.github/workflows/*`,
  `.gitlab-ci.yml`), and any `docker.sh` / `docker-compose.yml`. Capture the
  **exact** commands (e.g. `pnpm run eslint:check`, `pnpm run type:check`,
  `codecheck -f` *inside Docker*, `poetry run pytest`, `ruff check`,
  `npm run biome:check`, `astro check`). Note any command that runs **only in
  CI** or **only inside a container** — flag it as such (this matters for the
  Quick Commands block and the Phase 8 smoke test).
- **Package manager.** Infer from the **lockfile that actually exists**
  (`pnpm-lock.yaml` → pnpm, `poetry.lock` → poetry, etc.), never from habit.
- **Folder layout & modules.** Find the source roots (`src/`, `app/`, `lib/`,
  `pkg/`, `cmd/`, `pages/`, `components/`) and the major sub-modules within them.
  These become the per-module docs in Phase 5.
- **Test convention.** File naming (`*_test.py`, `*.spec.ts`, `*.test.ts`),
  framework (pytest / jest / vitest / playwright / go test), and where tests
  live (co-located vs `tests/`).
- **Deployment / runtime shape.** Containerized? Serverless? Static site?
  Long-running service? Library/package? This informs `ARCHITECTURE.md` and
  `PERFORMANCE.md`.
- **Existing conventions to carry forward.** Read any current `README`,
  `CONTRIBUTING`, `.editorconfig`, linter/formatter config, and the existing
  commit-message style (`git log`). **Carry these forward**; do not override a
  working convention with a generic one.

Then **load the matching preset** from `presets/` (one per common stack across
backend, frontend, mobile, and systems/infra — see `presets/README.md` for the
full index — or `generic` if nothing matches). Use it as a **reasoning
checklist**, and explicitly verify each preset
assumption against what you actually found — **detected reality wins over preset
assumptions**.

Write `.dwp/onboard/RECON.md` with: detected stack, package manager, exact
validation commands (flagged CI/Docker-only where relevant), source roots +
major modules, test convention, deployment shape, carried-forward conventions,
and which preset you used.

## Phase 2 — Archetype decision

Classify the repo using `../spec/ARCHETYPES.md` signals (summarized in
`presets/README.md`):

| Signal | Indicates orchestrator hub |
|--------|---------------------------|
| A `repositories/` (or equivalent) folder of multiple independent repos | strong |
| No single primary application stack at root; root is mostly markdown/coordination | strong |
| Sub-repos git-ignored / tracked separately | moderate |
| Cross-project standards, a repo navigation index, or orchestrator manifests | moderate |
| Root `AGENTS.md` indexes *other repos'* `AGENTS.md` | moderate |

- **Default to `individual repo`** (the 99% case) unless a clear majority of
  signals say hub.
- A monorepo with **one** build/stack is an **individual repo with modules**
  (handled by per-module docs), **not** a hub.
- If signals are **ambiguous**, present your assessment + evidence and **ask the
  developer** before proceeding.

Record the decision and the evidence in `.dwp/onboard/RECON.md`. Every phase
below branches on this decision where noted.

## Phase 3 — Generate `AGENTS.md` + `CLAUDE.md` symlink

Reason the content from Phase 1; do not template it.

**`AGENTS.md` (plain UTF-8 markdown, NO frontmatter, ~150–500 lines)** MUST serve
three roles:

1. **Index** — a documentation index table linking every `docs/` file you will
   create (Phase 4), each with a one-line description; plus an annotated
   repo-structure tree (≥2 levels) reflecting the **real** layout from recon.
   Link only files that will exist.
2. **Mandatory rules** — English-only; conventional commits
   (`type(scope): description`) with the repo's **real** scopes derived from its
   domains; the repo's **real** test pattern + coverage expectation; its error/
   logging conventions; repository-boundary rules (where the agent may/may not
   commit); and a progress-reporting + "never block work on reporting" note.
3. **Quick Commands** — a table of the **detected** install / test / lint /
   type-check / build / validate commands, verbatim. **Mark** any command that
   runs only in CI or only inside a container (e.g. "must run **inside** the
   Docker container").

**Orchestrator-hub additions** (only if Phase 2 said hub): add the sub-project
navigation index link (e.g. `repositories/README.md`) and each sub-project's
`AGENTS.md`; the **multi-project commit workflow** (commit inside each sub-repo,
never from the hub root); and **child-DWP** language per `../guide/GUIDE.md`
(orchestrator §).

**`CLAUDE.md`.** Create the symlink `ln -s AGENTS.md CLAUDE.md`. If the target
filesystem/host does not support symlinks, fall back to a one-line `CLAUDE.md`
containing exactly `@AGENTS.md`, and note the fallback in `.dwp/onboard/REPORT.md`.
Never duplicate `AGENTS.md` content into `CLAUDE.md`.

> **Existing-repo note:** if `AGENTS.md` already exists and is hand-written,
> merge your index/commands/rules into it rather than overwriting; back up +
> ask before any destructive change (Phase 0).

## Phase 4 — Generate `docs/`

Produce the standard categories, **each adapted** from recon — an empty or
generic doc is a failure. The conformance floor (all **MUST**):
`PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `STANDARDS.md`, `TESTING_GUIDE.md`,
`DEVELOPMENT_COMMANDS.md`, `SECURITY.md`, `AI_AGENT_ONBOARDING.md`,
`AI_AGENT_COLLAB.md`. **SHOULD**: `PERFORMANCE.md`, plus optional
`PR_REVIEW_WORKFLOW.md` and `ECOSYSTEM_CONTEXT.md`. Always add a
`docs/README.md` master index.

Each doc must contain **real** content:

- `PRODUCT_SPEC.md` — the non-technical product/why doc: the problem the repo
  solves, who it is for, its key capabilities/features, success criteria, and
  explicit non-goals. It **MUST read plainly enough that anyone — a person or an
  agent, technical or not — can understand what this repository is and why it
  exists at a glance**; that is the whole point of the document. Reason it from
  the README, package description, public API, and any roadmap/issues — never a
  generic stub. **Required for every repo, including libraries, CLIs, and
  internal tools**: if there are no end users, frame the product as its
  consumers (who calls this API, and why they choose it). This is the *why*; the
  docs below are the *how*.
- `ARCHITECTURE.md` — the real components, data flow, and deployment shape from
  recon; an annotated diagram of the actual module layout.
- `STANDARDS.md` — the repo's real coding conventions, naming, import order,
  error/logging patterns, and forbidden anti-patterns (carry forward existing
  linter config).
- `TESTING_GUIDE.md` — the **real** test framework + file-naming pattern + how
  to run/scope tests + coverage expectation.
- `DEVELOPMENT_COMMANDS.md` — the authoritative, **verbatim** command reference
  (install/test/lint/type-check/build/run), expanding the AGENTS.md Quick
  Commands; flag CI/Docker-only commands.
- `SECURITY.md` — the real secrets-handling location/convention, auth model,
  sensitive-data boundaries, and what agents MUST NOT write into docs.
- `PERFORMANCE.md` — performance-critical paths/budgets relevant to the runtime
  shape (skip or keep brief for trivial repos).
- `AI_AGENT_ONBOARDING.md` — a concrete first-session checklist for *this* repo
  (clone → install with the real PM → run the real validation → where things
  live).
- `AI_AGENT_COLLAB.md` — handoff, ownership, and conflict-avoidance rules.
- (optional) `PR_REVIEW_WORKFLOW.md`, `ECOSYSTEM_CONTEXT.md` — add when the repo
  uses PRs / sits in a multi-repo ecosystem. `ECOSYSTEM_CONTEXT.md` is **MUST**
  for an orchestrator hub.
- `docs/README.md` — a one-paragraph scope statement + a table linking every
  guide you created. **MUST** exist for a hub.

The preset for the detected stack lists the **doc emphases** that matter for
that stack — apply them.

## Phase 5 — Generate per-module nested docs

For each **major** source module found in Phase 1 (a folder representing a
distinct feature/bounded concern), create a `README.md` inside that folder
describing: the module's responsibility, key files / public surface, and how
it's tested. For a **complex or high-velocity** module (3+ interconnected
concerns), add a `docs/` subfolder with deeper guides, entered via a `README.md`.
A trivial/stable module needs only its `README.md`. Link each module's docs from
its own `README.md`; surface the most significant ones in the root `AGENTS.md`
index. (Reference `../spec/DOCUMENTATION_STANDARD.md` §4 for the per-module rule; which
modules count as "major"/"complex" is reasoned per repo.)

## Phase 6 — Generate `.agents/` + `.claude → .agents` symlink

Create the canonical cross-agent config directory. **All content must be
cross-agent** (readable by Cursor/Codex/Gemini/Copilot as personas/procedures),
and **stack-appropriate**, not generic boilerplate.

- **`.agents/agents/`** — reasoned worker personas. Baseline roles: `reviewer`,
  `architect`, `executor`, `debugger`, `qa`, `perf-optimizer`,
  `security-auditor`, plus any **stack-specific** role the preset suggests
  (e.g. a Django `migration-author`, a Vue `component-author`). Each persona
  must be described well enough that a non-Claude agent can read it.
- **`.agents/commands/`** — the six short DWP commands (`dwp-create`,
  `dwp-execute`, `dwp-refine`, `dwp-resume`, `dwp-status`, `dwp-verify`) plus stack-relevant
  ones (`code-review`, `pr`, `commit`, `branch`). **The `dwp-*` commands MUST be
  thin delegators, NOT copies of the flow.** Each is a short file (frontmatter
  `description:` + a body) that routes the invocation to the matching sub-skill
  of the installed `deepworkplan` skill — e.g. `/dwp-create` → the skill's
  `create` sub-skill, `/dwp-resume` → `resume`, etc. Do NOT re-author the
  command flow content (the skill owns it; duplicating it causes drift). This
  gives users the familiar short `/dwp-create` / `/dwp-resume` aliases while the
  single source of truth stays in the skill. (The skill's own sub-skills are
  already `user-invocable`, so `/deepworkplan-create` etc. also work; the
  `dwp-*` files are the shorter, conventional aliases.) Copy and adapt the
  ready delegator templates at [`command-templates/`](command-templates/) —
  one per `dwp-*` command — fixing the `<skill-path>` to where the skill is
  installed in the target repo. The same directory also ships `skill-create.md`
  and `agent-create.md` — thin delegators that route `/skill-create` and
  `/agent-create` to the **author** sub-skill so the onboarded repo can evolve
  its own kit (create/update skills, agents, commands). Copy and adapt these two
  alongside the `dwp-*` templates, fixing the same `<skill-path>`.
- **`.agents/skills/`** — **stack-appropriate** skills chosen by reasoning (use
  the preset's "skills to generate" list as a starting point, then verify
  against the repo's real needs), plus the DeepWorkPlan skill installed here
  (Phase 7).
- **`.agents/docs/`** — `skills_agents_catalog.md` and `COMMANDS_REFERENCE.md`,
  generated to **match what you actually created** (no phantom entries).
- **`.agents/settings.json`** — a sane harness-config baseline (sensible
  permissions; no secrets). `.agents/README.md` — a short entry point.
- **`.claude → .agents` symlink** — `ln -s .agents .claude`. Same symlink
  fallback as Phase 3 if unsupported (a tool-native pointer; document it).

> **Existing-repo note:** if `.agents/` (or per-tool `.claude/` / `.cursor/`)
> config already exists, reconcile into `.agents/` and add the `.claude` symlink
> only if absent; never delete existing personas/commands without asking.

## Phase 7 — Install the DeepWorkPlan skill + scaffold `.dwp/`

1. **Make the DeepWorkPlan skill available** to the target repo via one of (offer
   the developer the choice; recommend the first):
   - `npx skills add DailybotHQ/deepworkplan-skill`
   - OpenClaw: `openclaw skills install deepworkplan`
   - `git clone` the skill repo + run its `setup.sh`
   - or symlink the local skill pack into `.agents/skills/deepworkplan/`.
2. **Scaffold the gitignored output area** (per `../shared/dwp-paths.md`):
   create `.dwp/plans/` and `.dwp/drafts/`, each with a `README.md` placeholder,
   and add `.dwp/` to the repo's `.gitignore` (append the rule
   non-destructively — do not rewrite the file). `.dwp/` is the only DWP output
   location; it **replaces** any pre-v2 DWP output tree (see
   `../shared/dwp-paths.md` for the contrast). If an older DWP output tree
   exists, note it for migration (do not delete without asking).
3. **Scaffold the `tmp/` scratch area** (per `DOCUMENTATION_STANDARD.md` §2.6):
   create a root-level `tmp/` with a `.gitkeep`, add `tmp/` to the repo's
   `.gitignore` (append non-destructively), and note the convention in
   `AGENTS.md` — a gitignored freeform scratch space for ephemeral/throwaway
   work (exploratory output, data exports, inter-agent prompt handoffs), kept
   distinct from the **structured** `.dwp/` plan output. If `tmp/` already
   exists, leave it as-is.

## Phase 7b — Offer optional addons (opt-in)

After the core AI-first scaffolding, **enumerate** the available addons under
`../addons/` and offer each as an **explicit opt-in** step. Addons are **never
required** — a repo is fully conformant with zero addons. In **trust mode**, you
MAY recommend the obviously-applicable ones, but still surface them.

Three addons ship today; enumerate **all** and offer each independently:

| Addon | Folder | Recommend in trust mode when… |
|-------|--------|-------------------------------|
| **Devcontainer support** | [`../addons/devcontainer/`](../addons/devcontainer/SKILL.md) | the repo benefits from a reproducible isolated dev container (most repos with Docker/services). |
| **Dailybot integration** | [`../addons/dailybot/`](../addons/dailybot/SKILL.md) | the developer/team **already uses Dailybot** or asks for team progress reporting — **do NOT auto-install for everyone**. |
| **Dependency upgrade** | [`../addons/dependency-upgrade/`](../addons/dependency-upgrade/SKILL.md) | the repo has a lockfile + a dependency-heavy stack and wants safe, batched, validated upgrades — recommend only when a lockfile is present; **never auto-install for everyone**. |

The first addon is **devcontainer support**
([`../addons/devcontainer/SKILL.md`](../addons/devcontainer/SKILL.md) +
[`SPEC.md`](../addons/devcontainer/SPEC.md)). If the developer accepts: read that
addon's `SKILL.md` and run its flow — match a preset in
`../addons/devcontainer/templates/presets.md` to the stack you detected in
Phase 1, then **reason out** a devcontainer adapted to that stack (base image,
user, `workspaceFolder`, supporting services from the app's real dependencies,
ports, public-vs-private secrets handling) while preserving the common skeleton
(AI-CLI persistence volumes for claude/codex/cursor/gh/dailybot + read-only
ssh/gitconfig mounts, `dailybot-project-network`, `DOCKER_DEV_ENV=vscode` →
`sleep infinity`, the `codecheck`/`check`/`fix`/`test` validation aliases, and
project-identity precedence per the addon SPEC §4). An **existing devcontainer
MUST be reconciled, not clobbered** — preserve working ports/network/identity and
only add missing skeleton pieces; back up and ask before any destructive change.
For a **public** repo, the addon also adds a secret-excluding `.dockerignore` and
keeps `.env.example` secret-free. After applying, run the addon's validation step
(SPEC §6). If declined, skip it and continue — the repo stays
baseline-conformant.

The second addon is **Dailybot integration**
([`../addons/dailybot/SKILL.md`](../addons/dailybot/SKILL.md) +
[`SPEC.md`](../addons/dailybot/SPEC.md)). Offer it **only when relevant** — the
developer or team already uses Dailybot, or explicitly wants team progress
reporting; in trust mode, recommend it **only** on that signal and **never
auto-install it for everyone**. If accepted: read that addon's `SKILL.md` and run
its flow — detect whether the Dailybot skill/CLI is already present
(reconcile-don't-clobber), offer the **opt-in** install paths (Dailybot agent
skill via `npx skills add DailybotHQ/agent-skill` / OpenClaw / git clone +
`setup.sh`, or the Dailybot CLI), **defer all authentication** to the Dailybot
skill's own consent flow (`shared/auth.md` — `dailybot login` or
`DAILYBOT_API_KEY`; never reinvent or store credentials), and wire the
**optional** progress-report step into DWP execution so a **plan completion**
emits a Dailybot **milestone** report via the dailybot `report` sub-skill. That
report step is strictly **best-effort and never blocks** the work if Dailybot is
absent, unauthenticated, or unreachable. The core DeepWorkPlan methodology has
**zero Dailybot dependency** — this addon is purely optional team visibility.
After applying, run the addon's validation step (SPEC §8). If declined, skip it
and continue — the repo stays baseline-conformant.

The third addon is **dependency upgrade**
([`../addons/dependency-upgrade/SKILL.md`](../addons/dependency-upgrade/SKILL.md) +
[`SPEC.md`](../addons/dependency-upgrade/SPEC.md)). It is **package-manager
agnostic** — offer it when the repo has a lockfile and a dependency-heavy stack;
in trust mode recommend it **only** when a lockfile is present, and **never**
auto-install it for everyone. If accepted: read that addon's `SKILL.md` and run
its flow — detect the repo's real package manager (npm/pnpm/yarn + ncu,
pip/poetry/uv, cargo, go mod, bundler, composer…), classify upgrades by semver,
upgrade in safe batches, run the repo's **real** validation gate after each
batch, revert a failing batch, and summarize. **Only when accepted**, the addon
installs a `/lib-upgrade` delegator into the repo's `.agents/commands/`. After
applying, run the addon's validation step (SPEC §9). If declined, skip it — the
repo stays baseline-conformant and no command is installed.

## Phase 8 — Self-check / validation (mandatory)

See the dedicated section below.

---

# Phase 8 — Self-check / validation (run in the TARGET repo)

After generating, run this checklist in the target repo. On any failure,
**fix-then-recheck** before reporting done.

1. **`AGENTS.md` exists** and contains a Quick Commands block whose commands are
   **real and runnable** (not placeholders). Spot-check that referenced commands
   exist in the manifest/Makefile/scripts.
2. **`CLAUDE.md` resolves to `AGENTS.md`** — the symlink points at `AGENTS.md`,
   or `CLAUDE.md` contains exactly `@AGENTS.md`.
3. **`docs/` has the standard categories**, each non-empty and repo-specific
   (the eight MUST files at minimum — `PRODUCT_SPEC` included — plus
   `docs/README.md`). Grep for leftover
   placeholder markers (`<...>`, "TODO", "your command here") and fix any.
4. **Every major source module has a `README.md`** (and complex modules have a
   `docs/`).
5. **`.agents/`** has `agents/`, `commands/`, `skills/`, `docs/`, `settings.json`
   and a `.claude → .agents` symlink (or documented fallback);
   `skills_agents_catalog.md` and `COMMANDS_REFERENCE.md` **match** what was
   actually created (no phantom entries). **The six `dwp-*` commands exist** in
   `.agents/commands/` (`dwp-create`, `dwp-execute`, `dwp-refine`, `dwp-resume`,
   `dwp-status`, `dwp-verify`) and are thin delegators (no leftover `<skill-path>`
   placeholder, no copied flow body).
6. **DeepWorkPlan skill is discoverable** and `.dwp/` exists, is gitignored
   (`git check-ignore .dwp` confirms), and has `plans/` + `drafts/`. **`tmp/`
   exists and is gitignored** (`git check-ignore tmp` confirms).
7. **Smoke test — run the repo's OWN detected validation command once** to
   confirm recon was accurate (e.g. the lint or test command). If it cannot run
   (e.g. Docker required and unavailable, network-gated CI command), **note why**
   in the report instead of silently skipping.
8. **Archetype-specific:** if orchestrator hub, confirm the sub-repo navigation
   index + multi-project commit workflow are documented and `ECOSYSTEM_CONTEXT.md`
   exists.
9. **Write the onboarding report** to `.dwp/onboard/REPORT.md` summarizing: the
   archetype chosen + evidence, the detected stack + package manager, the exact
   validation commands captured, the full list of files/folders generated or
   modified, addons accepted/declined, the smoke-test result, any symlink
   fallback used, and **any items deferred to the developer** (e.g. ambiguous
   modules, a command that couldn't be smoke-tested).

Report a concise summary to the developer: archetype, stack, what was generated,
the smoke-test result, and any deferred items — pointing them at
`.dwp/onboard/REPORT.md` for the detail.

---

## Modes & invocation

- `/deepworkplan-onboard` (or "make this repo AI-first", "onboard this repo",
  "set up AGENTS.md + docs + .agents") — full guided flow (consent before
  writing).
- `--dry-run` / "just show me the plan" — recon + planned change set, **no
  writes** (Phase 0.5).
- `trust` / `auto` — proceed without per-step confirmations, but still get the
  one consent gate in Phase 0 before the first write and still surface addons.

## Failure-mode guardrails (do not violate)

- **No placeholders ship.** If a real value is unknowable, ask — never write
  `<...>` or a generic guess into `AGENTS.md` / `docs/`.
- **No clobbering.** Existing hand-written artifacts are merged/backed-up/asked
  about, never silently overwritten.
- **No phantom catalog entries.** `.agents/docs/` must reflect exactly what
  exists.
- **No stack mismatch.** If the preset and the real repo disagree, the **real
  repo wins** — re-derive from recon.
- **Idempotent.** Re-running on an onboarded repo only fills gaps; it does not
  duplicate or churn working files.
