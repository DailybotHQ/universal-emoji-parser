# SPEC.md — Dependency-Upgrade Addon (Normative)

## Abstract

This document is the **normative specification** of the DeepWorkPlan
**dependency-upgrade addon**: an opt-in capability that **safely upgrades a
repository's dependencies** with a **batched, validated, revertible** workflow.
It defines **package-manager detection** (RFC-2119), **semver classification**,
the **batched-upgrade** rule, the **validate-after-each-batch** gate, the
**revert-on-failure** rule, the **reconcile-don't-clobber** behavior, and the
**validation** step.

The addon is **package-manager agnostic**: it reasons about the repo's **actual**
manager (npm/pnpm/yarn, pip/poetry/uv/pipenv, cargo, go mod, bundler, composer,
and more) rather than assuming npm. It is governed by `../README.md` and
`methodology-spec/ADDONS.md`: it is **never** required for baseline AI-first
conformance.

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Companions** | `SKILL.md`, `templates/ecosystems.md`, `templates/upgrade-report.md`, `templates/lib-upgrade-command.md`, `../README.md`, `methodology-spec/ADDONS.md` |
| **License** | MIT |

## 1. Conventions

The RFC 2119 keywords (**MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**,
**MAY**, **OPTIONAL**) are interpreted as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

Throughout, a **batch** is a small, coherent set of dependency upgrades applied
and validated together, and the **gate** is the repo's real validation command
set (lint + typecheck + build + test, as applicable).

---

## 2. Package-Manager Detection (the part the addon reasons about)

- The addon **MUST** detect the package manager(s) from the **manifest and
  lockfile that actually exist** in the repo. It **MUST NOT** assume npm or any
  single ecosystem.
- Detection signals **MUST** be derived from real files, e.g.:

  | Ecosystem | Manifest | Lockfile → manager |
  |-----------|----------|--------------------|
  | JS / TS | `package.json` | `pnpm-lock.yaml` → pnpm · `yarn.lock` → yarn · `package-lock.json` → npm |
  | Python | `pyproject.toml` / `requirements*.txt` / `Pipfile` | `poetry.lock` → poetry · `uv.lock` → uv · `Pipfile.lock` → pipenv · pinned `requirements*.txt` → pip / pip-tools |
  | Rust | `Cargo.toml` | `Cargo.lock` → cargo |
  | Go | `go.mod` | `go.sum` → go modules |
  | Ruby | `Gemfile` | `Gemfile.lock` → bundler |
  | PHP | `composer.json` | `composer.lock` → composer |

- A repo **MAY** contain **multiple** ecosystems (e.g. a JS frontend + a Python
  service). The addon **MUST** handle each ecosystem with its own manager and its
  own batches.
- For JS/TS, `ncu` (npm-check-updates) **MAY** be used as the cross-manager
  **version checker**, but the **install/update verb MUST** be the detected
  manager's (`pnpm install`, `yarn install`, `npm install`).
- The full per-ecosystem command reference is `templates/ecosystems.md`; it is a
  **checklist**, not an answer key — **detected reality wins**.

---

## 3. Semver Classification

- Every outdated dependency **MUST** be classified by semantic version against
  its current pinned version:
  - **patch** `X.Y.Z → X.Y.(Z+1)` (safest),
  - **minor** `X.Y.Z → X.(Y+1).0` (usually safe),
  - **major** `X.Y.Z → (X+1).0.0` (breaking changes possible).
- **patch + minor** upgrades **MAY** be batched automatically.
- **major** upgrades **MUST** require explicit developer approval before
  inclusion; the addon **MUST** present them and wait.
- Tightly coupled packages (a tool + its plugins; a framework + its companion
  packages) **SHOULD** be upgraded in the **same** batch so a peer-dependency
  constraint is not split across batches.

---

## 4. Batched Upgrade

- The addon **MUST** apply upgrades in **small, coherent batches** and **MUST
  NOT** upgrade everything at once (an all-at-once upgrade makes a failure
  impossible to isolate or revert cleanly).
- A reasonable order is: **patch** batch → **minor** batch → each approved
  **major** on its own.
- Each batch **MUST** update the manifest and regenerate the lockfile **via the
  detected manager's install/update command**. The addon **MUST NOT** hand-edit
  a lockfile.

---

## 5. Validate-After-Each-Batch Gate

- After every batch, the addon **MUST** run the **repo's real validation gate** —
  the actual lint / typecheck / build / test commands the repo uses.
- The gate **MUST** be discovered from the repo (`AGENTS.md` Quick Commands,
  `docs/DEVELOPMENT_COMMANDS.md`, the manifest's scripts, or the devcontainer
  addon's `codecheck`/`check`/`fix`/`test` aliases if present). The addon **MUST
  NOT** invent a gate.
- A batch is **accepted** only if the gate passes. A batch whose gate fails
  **MUST** be handled per §6.

---

## 6. Revert on Failure

- If a batch's gate fails, the addon **MUST** revert **just that batch**:
  restore the manifest **and** lockfile (e.g. `git checkout -- <manifest>
  <lockfile>`), re-run install to resync, and confirm the gate passes again.
- The addon **MUST** record the reverted batch as skipped/failed with the failing
  gate and reason. It **MAY** retry the batch one package at a time to isolate the
  culprit.
- A failing major upgrade **MUST** be set aside, never force-installed past a
  broken gate.
- The addon **MUST NOT** auto-commit; it surfaces the diff and lets the developer
  commit (suggested: `chore(deps): …`).

---

## 7. Reconcile, Don't Clobber

- The addon operates on the repo's **existing** manifests and lockfiles; it
  **MUST** preserve every pin and constraint it does not deliberately upgrade.
- It **MUST NOT** delete or rewrite a lockfile wholesale, change the package
  manager, or remove dependencies without explicit approval.
- It **MUST** record what it changed (in the upgrade report).

---

## 8. Onboarding Hook + `/lib-upgrade` Delegator

- The addon's onboarding hook (`SKILL.md`) is offered by `onboard` Phase 7b as an
  **opt-in** step and **MUST NOT** be applied without acceptance.
- **Only when accepted**, the addon **MUST** install a `/lib-upgrade` delegator
  command into the target repo's `.agents/commands/` (template:
  `templates/lib-upgrade-command.md`) that delegates to this addon. A declined
  addon installs **no** command and leaves a baseline-conformant repo.

---

## 9. Validation Step (run after applying)

The addon is correctly applied when **all** hold:

1. The package manager(s) were **detected from real manifests/lockfiles**, not
   assumed (no npm/ncu run in a non-JS repo).
2. Upgrades were **classified** by semver and **batched** (never all-at-once);
   majors required explicit approval.
3. The **repo's real gate** ran after **each** batch and every accepted batch
   passes it.
4. Any failing batch was **reverted** (manifest + lockfile restored, install
   resynced, gate green) and recorded.
5. No lockfile was hand-edited; no auto-commit happened.
6. An upgrade **report** (`templates/upgrade-report.md`) summarizes upgraded /
   skipped / reverted / validated.
7. If accepted via onboarding, a `/lib-upgrade` delegator exists in the repo's
   `.agents/commands/`; if declined, none was installed.

---

## 10. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `SKILL.md` (the onboarding hook + flow), `templates/*` (reasoning aids)
- `../README.md` (addon mechanism), `methodology-spec/ADDONS.md` (concept + pointer)
- [Semantic Versioning](https://semver.org/)
- [npm-check-updates](https://github.com/raineorshine/npm-check-updates)

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
