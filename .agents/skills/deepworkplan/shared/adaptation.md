# adaptation.md — Reasoning Over Copy-Paste

> How DeepWorkPlan sub-skills (especially `onboard`) adapt to a target
> repository instead of blindly copying a template.

## The principle: reason, don't copy-paste

When a flow generates AI-first structure (`AGENTS.md`, `docs/`, per-module docs,
`.agents/`, validation commands, example plans) for a target repo, it **MUST
reason about that repo** rather than copy-pasting a fixed template. Audits across
six repositories showed the structure is **~90% identical** and **~10%
repo-specific** — and that 10% (the validation commands, paths, primary stack,
stack-specific skills, and example plans) is exactly the part that must be
**reasoned per repo**.

Concretely, before writing anything, a flow **MUST** discover:

- The repo's **primary stack** (language, framework, package manager) from
  manifest files (`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`,
  etc.).
- The repo's **validation commands** (lint, type-check, test, build) from
  scripts/config — never assume a fixed command set.
- The repo's **architecture and module layout**, to place per-module docs where
  they belong.
- Any **existing** AI-first setup, so generation **reconciles** with it rather
  than clobbering it (approval required before destructive changes).

The fixed ~90% (the baseline shape — `AGENTS.md` as index + rules + quick
commands, the `docs/` categories, `.agents/` with the `.claude → .agents`
symlink, the `.dwp/` output convention) is applied as-is; the variable ~10% is
filled by reasoning.

## The two archetypes

Adaptation also forks on the repository archetype (see Task 2's
`../spec/ARCHETYPES.md`):

- **Individual repo (the 99% case)** — one primary stack. The lean path:
  classify → reason about the stack-specific 10% → generate the baseline.
- **Orchestrator hub** — a coordination repo orchestrating multiple
  sub-repositories. The additive path: baseline first, then layer hub-only
  structure (sub-project navigation index, `ECOSYSTEM_CONTEXT.md`, cross-project
  standards, repository-boundary rules) and wire the orchestrator/child-DWP
  capability.

The `onboard` flow classifies the target repo using the `../spec/ARCHETYPES.md`
heuristic and confirms with the user when signals are ambiguous.

> Deeper per-stack presets and the full onboarding reasoning procedure are
> elaborated in **Task 5** (`onboard/SKILL.md`). This stub fixes the principle
> and the archetype fork.
