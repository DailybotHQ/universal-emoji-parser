---
name: deepworkplan-author
description: Author or update reusable skills, agents, and commands in the current repo — reason about the repo's .agents/ layout, follow the Open Agent Skills frontmatter contract, and keep the .agents/docs/ catalog in sync. Use when a developer wants to create or evolve the repo's agent kit (skills, agents, commands), or runs /skill-create or /agent-create.
version: "2.5.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
---

# DeepWorkPlan — Author

Author and maintain the current repository's **agent kit**: reusable **skills**, **agents**, and
**commands**. Reason about the repo — never copy a generic kit. This sub-skill is also the executor of
the mandatory "Skills & Agents Discovery" plan task.

---

## Concepts

- **Skill** — a reusable, parameterized *procedure* invoked in-session (e.g. `/fix-lint`). Encodes
  "how to do X". Lives in `<skills-dir>/<name>/SKILL.md`.
- **Agent** — a specialized *worker definition* (role, model tier, tools, system prompt) dispatched to
  handle a class of tasks (e.g. `reviewer`, `executor`). Encodes "who does X". Lives in
  `<agents-dir>/<name>.md`.
- **Command** — a thin slash-command entry point that routes to a skill or agent. Logic stays in the
  skill/agent; the command is a delegator.

| Need | Create |
|------|--------|
| A repeatable procedure run in-session | Skill |
| A persistent role with its own model tier / tools | Agent |
| A shortcut to invoke a skill or agent | Command |

---

## Step 0 — Detect the repo layout (do NOT assume)

Before authoring anything, discover where this repo keeps its kit. Do not hardcode any single repo's
conventions.

1. Find the agent root: look for `.agents/`, then `.claude/` (often a symlink to `.agents/`), then any
   `AGENTS.md` / `CLAUDE.md` at the repo root for documented paths.
2. Within it, locate `skills/`, `agents/`, `commands/`, and a catalog under `docs/`.
3. Inspect 1-2 existing skills/agents to learn the repo's **local conventions** (frontmatter keys it
   uses, naming, body structure, whether commands are thin delegators). Match them.

```bash
ls -d .agents .claude 2>/dev/null
ls .agents/skills .agents/agents .agents/commands .agents/docs 2>/dev/null
ls AGENTS.md CLAUDE.md 2>/dev/null
```

If the repo has no `.agents/` layout yet, route the developer to the **onboard** sub-skill first
(`onboard/SKILL.md`) — onboarding scaffolds the directories this sub-skill writes into.

---

## Flows

Pick the flow that matches the developer's intent.

### A. Create a skill

1. **Audit fit** — confirm a real, repeatable workflow exists (see "Repo-fit rubric" below). Skip
   generic skills that do not match an actual workflow.
2. **Name it** — kebab-case, English, unique. Check for collisions in the skills dir.
3. **Scaffold** — copy `templates/SKILL_TEMPLATE.md` into `<skills-dir>/<name>/SKILL.md`. Adapt the
   frontmatter to the repo's local convention (keys it already uses).
4. **Fill** — one-procedure focus; clear Goal, When-to-use, Steps, Validation.
5. **Keep commands thin** — if it needs a slash command, add a delegator (see Flow C).
6. **Catalog** — update the repo's catalog under the docs dir (see "Keep the catalog in sync").
7. **Validate** — naming, structure, frontmatter, and that any command is thin.

### B. Create an agent

1. **Confirm a recurring role** with distinct model/tools needs (not just a one-off procedure → that
   is a skill).
2. **Name it** — kebab-case, English, unique.
3. **Scaffold** — copy `templates/AGENT_TEMPLATE.md` into `<agents-dir>/<name>.md`.
4. **Choose a model tier** — reason about it (see "Model tiers" below). Do NOT hardcode vendor model
   IDs inside the agent body; keep the abstract tier and map it in repo config.
5. **Fill** — Role, Inputs, Process, Output, escalation rules.
6. **Catalog** — update the catalog under the docs dir.
7. **Validate** — naming, structure, tier chosen with justification.

### C. Create a command (thin delegator)

1. Confirm the target skill or agent exists.
2. Add `<commands-dir>/<cmd>.md` as a ~20-line delegator: read the target skill/agent fresh and follow
   it, passing along args. Do NOT embed logic — logic lives in the skill/agent so updates propagate.
3. Reference the new command in the catalog / commands reference.

### D. Update an existing skill / agent / command

1. Read the existing file and the repo's conventions first.
2. Make the smallest change that satisfies the request; preserve frontmatter the repo relies on.
3. Keep delegators thin; keep skills single-procedure.
4. Update the catalog if name, description, or surface changed.

### E. Evaluate the catalog (Skills & Agents Discovery)

This is the flow invoked by the mandatory plan task.

1. Enumerate every skill (`<skills-dir>/*/SKILL.md`) and agent (`<agents-dir>/*.md`).
2. For each, capture name, one-line description, and model tier (if any).
3. Cross-check against the repo's catalog under the docs dir: flag missing entries, stale
   descriptions, orphaned commands, and duplicates.
4. Reconcile: update the catalog so it matches reality. Report drift found and fixed.

---

## Repo-fit rubric (before creating)

Gather: stack & tooling (languages, frameworks, package manager, test runner, linter); workflows (how
code is built, tested, reviewed, released); pain points (repetitive manual steps); the existing kit
(avoid duplicates). Then:

- Create a **skill** for a repeatable procedure people do by hand.
- Create an **agent** for a recurring role with distinct model/tools needs.
- Create a **command** only as a thin entry point.
- Skip anything generic that does not match a real workflow.

Anti-patterns to avoid: generic kits that do not match the repo; fat commands with embedded logic;
duplicates of existing skills/agents; agents pinned to vendor model IDs in their bodies.

---

## Model tiers (for agents)

Skills inherit the session model; agents may pin an abstract tier.

| Tier | Use for | Examples |
|------|---------|----------|
| **light** | Mechanical, well-specified, low-judgment tasks | formatting, lint fixes, renames, list/status commands |
| **standard** | Most engineering work; moderate reasoning | feature work, refactors, test writing, reviews |
| **heavy** | High-judgment, architectural, ambiguous tasks | architecture, security audits, complex planning |

How to choose: default to **standard**; drop to **light** only if mechanical and well-specified; raise
to **heavy** only for deep reasoning or high blast radius. Keep tiers abstract — map them to concrete
model IDs in the repo's runtime/config, in one place, never inside skill bodies.

---

## Keep the catalog in sync

After any create/update, reconcile the repo's catalog (commonly under the docs dir, e.g. a
skills/agents catalog and a commands reference). Add or update the row for the affected skill/agent/
command: name, one-line description, tier (agents), and the command that invokes it. The catalog must
always match what is on disk.

---

## Templates

- `templates/SKILL_TEMPLATE.md` — skill scaffold.
- `templates/AGENT_TEMPLATE.md` — agent scaffold.

Reference them by these relative paths. Adapt the frontmatter to the host repo's local convention
(some repos add `version`, `documentation_url`, or `user-invocable`; match what neighboring files use).

---

## Validation

- Names are kebab-case, English, unique.
- Frontmatter matches the repo's convention; descriptions are a single line starting with a verb.
- Skills are single-procedure; agents declare a justified tier (no hardcoded vendor model IDs).
- Commands are thin delegators with no embedded logic.
- The catalog under the docs dir reflects every change.

---

## Notes

- Reason about the repo; never copy a generic kit.
- Propose before creating when scope is broad — confirm the short list with the developer first.
- All references inside the skill are relative; nothing outside the skill root is required at runtime.
