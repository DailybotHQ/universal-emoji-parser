---
name: deepworkplan-verify
description: Verify that a repository is DeepWorkPlan-conformant (AI-first) and that its plans are well-formed, producing an objective pass/fail report. Use when the developer asks to verify, audit, or check conformance of a repo or a plan.
version: "2.4.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
---

# DeepWorkPlan — Verify (conformance check)

Check, objectively, whether a repository is **DeepWorkPlan-conformant** (AI-first
and agent-pilotable) and whether its Deep Work Plans are well-formed. This
sub-skill is **read-only**: it reports pass/fail, it does not change files. The
normative criteria are defined in the specification's Conformance document
(<https://deepworkplan.com/spec>).

## Shared resources (read these)

- [`../shared/context.sh`](../shared/context.sh) — resolve the repo root and `.dwp/`.
- [`../shared/dwp-paths.md`](../shared/dwp-paths.md) — plans live at `.dwp/plans/PLAN_{name}/`.

## Parameter support

- `/dwp-verify` — verify the repository (the default).
- `/dwp-verify plan {name}` — also verify a specific plan's well-formedness.
- `/dwp-verify all` — verify the repository and every plan under `.dwp/plans/`.

## The overriding rule

Report what is **true on disk**, not what should be true. A criterion passes only
if the artifact exists *and* carries real, repository-specific content. A generic
stub, a placeholder, or a command that cannot run in this repository **fails** the
criterion — say so explicitly. Never mark a check passed without evidence.

## Repository checks

Run these from the repo root and record each result. Prefer the mechanical check;
fall back to reading the file when judgment is required (for example, deciding
whether `AGENTS.md` commands are real).

```bash
# 1. AGENTS.md at the root, with a Quick Commands block
test -f AGENTS.md && grep -qiE 'quick commands|## commands' AGENTS.md && echo "AGENTS.md: ok" || echo "AGENTS.md: FAIL"

# 2. CLAUDE.md resolves to AGENTS.md (symlink or equivalent single source)
[ -L CLAUDE.md ] && [ "$(readlink CLAUDE.md)" = "AGENTS.md" ] && echo "CLAUDE.md symlink: ok" || echo "CLAUDE.md symlink: CHECK"

# 3. docs/ with the standard categories
test -d docs && echo "docs/: present" || echo "docs/: FAIL"
for d in ARCHITECTURE STANDARDS TESTING_GUIDE DEVELOPMENT_COMMANDS SECURITY AI_AGENT_ONBOARDING; do
  ls docs/ 2>/dev/null | grep -qi "$d" && echo "  docs/$d: ok" || echo "  docs/$d: missing"
done

# 4. .agents/ home with agents/ commands/ skills/ + a docs catalog; .claude resolves
for d in .agents/agents .agents/commands .agents/skills .agents/docs; do
  test -d "$d" && echo "$d: ok" || echo "$d: FAIL"
done
[ -e .claude ] && echo ".claude resolves: ok" || echo ".claude resolves: FAIL"

# 5. dwp-* commands are thin delegators (≤ ~30 lines, reference the skill)
for f in .agents/commands/dwp-*.md; do
  [ -f "$f" ] || continue
  lines=$(wc -l < "$f")
  grep -qi 'deepworkplan' "$f" && [ "$lines" -le 40 ] && echo "$(basename "$f"): thin ok" || echo "$(basename "$f"): CHECK ($lines lines)"
done

# 6. .dwp/ gitignored with plans/ + drafts/; tmp/ gitignored
git check-ignore .dwp >/dev/null 2>&1 && echo ".dwp gitignored: ok" || echo ".dwp gitignored: FAIL"
test -d .dwp/plans && test -d .dwp/drafts && echo ".dwp structure: ok" || echo ".dwp structure: FAIL"
git check-ignore tmp >/dev/null 2>&1 && echo "tmp gitignored: ok" || echo "tmp gitignored: SHOULD"
```

Then, by reading rather than grepping:

- **Real commands.** Open `AGENTS.md` and confirm the Quick Commands actually correspond to this repo (the real package manager, test, lint, and build commands). Flag any command that could not run here.
- **Catalog matches disk.** Confirm `.agents/docs/` (the skills/agents catalog) lists exactly the skills, agents, and commands that exist under `.agents/` — no dead links, no missing entries.
- **Skill resolvable.** Confirm the DeepWorkPlan skill is installed or referenced so its sub-skills can be invoked.

## Plan checks (when verifying a plan)

For each plan under `.dwp/plans/PLAN_{name}/`:

- Every task file declares an explicit scope, **acceptance criteria**, and at least one **validation gate** (a runnable command or check).
- `PROGRESS.md` exists and is updated, so the plan is resumable.
- The two mandatory final tasks are present — Skills & Agents Discovery and the Executive Report.
- Tasks re-anchor to the plan goal before executing.

## Output

Produce a concise report:

```
DeepWorkPlan conformance — {repo name}

Repository
  [x] AGENTS.md (real Quick Commands)
  [x] CLAUDE.md -> AGENTS.md
  [ ] docs/ — missing SECURITY.md
  [x] .agents/ + catalog matches disk
  [x] .dwp/ gitignored (plans/, drafts/)
  [x] tmp/ gitignored
  [x] skill resolvable

Verdict: NOT CONFORMANT — 1 issue.
Next: run /dwp-create "fix conformance gaps" to plan the remediation, then /dwp-execute.
```

End with one of: **CONFORMANT** (all MUST criteria pass) or **NOT CONFORMANT — N issue(s)**, listing each failure. If gaps exist, offer to capture the fixes as a Deep Work Plan with `/dwp-create` — do not fix them silently inside this read-only check.
