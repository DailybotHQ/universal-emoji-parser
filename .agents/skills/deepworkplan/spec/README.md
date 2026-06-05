# DeepWorkPlan Methodology Specification — v2.0.0

> The canonical normative standard for an **AI-first autopilot repository** and the
> **Deep Work Plan (DWP)** workflow. Version **2.0.0**. This v2 spec **supersedes**
> the v1 baseline specs in `PLAN_build_deepworkplan_brand/.../deepworkplan/spec/`
> (and the upstream `repo-ready/` and `opensource` drafts). Reconciled from that
> baseline plus the 6 (+1) new ideas per `../RECONCILIATION.md`.

All documents use RFC-2119 normative language (MUST / SHOULD / MAY / MUST NOT) and
are grounded in an audit of 6 Dailybot repositories (~90% common structure, ~10%
reason-per-repo). Both repository archetypes — individual repo (99% case) and
orchestrator hub — are addressed throughout.

## Documents

| Document | Defines |
|----------|---------|
| [`DOCUMENTATION_STANDARD.md`](DOCUMENTATION_STANDARD.md) | Repo structure: `AGENTS.md` (index + mandatory rules + quick commands), `CLAUDE.md → AGENTS.md`, the 10 `docs/` categories, per-module nested docs, `.agents/` layout, `.claude → .agents` symlink, and the reason-per-repo 10%. |
| [`DWP_SPECIFICATION.md`](DWP_SPECIFICATION.md) | The DWP workflow: single-step refined-draft create flow, `.dwp/` output, the 9-section task anatomy, validation/completion/resume, the two mandatory final tasks, orchestrator + team-agents support. |
| [`AGENT_PROTOCOL.md`](AGENT_PROTOCOL.md) | Cross-agent behavior: the six supported agents, the `/` vs `#` command mapping, shared `.agents/` reading, progress-reporting expectation. |
| [`ARCHETYPES.md`](ARCHETYPES.md) | The two archetypes, the classification heuristic, and how onboarding differs. |
| [`ADDONS.md`](ADDONS.md) | The opt-in addon mechanism + contract (reconcile-don't-clobber); devcontainer as the first addon (pointer to Task 6). |

## Key v2 Divergences from v1 (see `../RECONCILIATION.md`)

1. Distribution: WebFetch framework repo → **installed skill pack** (idea #2).
2. Output path: `.agent_commands/.../results/` → gitignored **`.dwp/`** (idea #3).
3. Create flow: two-step draft → **single refined draft** (idea #4).
4. **`.claude → .agents`** directory symlink + canonical `.agents/` (idea #1).
5. **Two archetypes** made first-class (idea #5).
6. **Per-module `README.md` + `docs/`** formalized as normative (idea #6).
7. **Opt-in addons** mechanism, devcontainer first (idea #7).
8. Version **1.0.0 → 2.0.0** (major, breaking).

---

*DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
