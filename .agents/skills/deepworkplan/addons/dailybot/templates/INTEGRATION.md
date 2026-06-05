# Template — Dailybot Integration (reason, don't copy-paste)

Reasoning guidance for wiring the Dailybot addon into a target repo. This is
**not** a file to drop in verbatim — the commands and the doc wording are
**reasoned against the target repo** (its agent host, its real DWP execution
docs, whether it is public/private, whether a repo identity already exists).
Keep the SPEC contract intact: **opt-in, defer auth, never block,
reconcile-don't-clobber, vendor-neutral.**

---

## 1. Detect if Dailybot is already installed (reconcile-don't-clobber)

Run these **before** offering to install anything. Where a piece exists, do not
redo it — record it and only fill gaps.

```bash
# Is the Dailybot CLI on PATH?
command -v dailybot && dailybot --version 2>&1

# Is the Dailybot skill installed for this agent? (adjust the path to the host)
#   Claude Code: ~/.claude/skills/dailybot/   Cursor: ~/.cursor/skills/dailybot/
#   Codex: ~/.codex/skills/dailybot/          Gemini: ~/.gemini/skills/dailybot/
ls -d ~/.*/skills/dailybot 2>/dev/null

# Is a repo identity already committed?
ls .dailybot/profile.json .dailybot_example/profile.json 2>/dev/null

# Is auth already good? (only meaningful if the CLI is present — never prompt here)
command -v dailybot >/dev/null 2>&1 && dailybot status --auth 2>&1

# Has Dailybot been disabled for this repo? (respect the opt-out — send nothing)
ls .dailybot/disabled 2>/dev/null
```

Decision notes:

- **Skill present** → do not reinstall. Just verify the report step is wired.
- **CLI present but skill absent** → the integration still works; the report
  routes through the CLI (`dailybot agent update ... --milestone`). Offer the
  skill only if the developer wants the richer routing/writing guidance.
- **Identity present** → keep it. Never overwrite a working `profile.json`; never
  add a `key` field (credentials in that file are a hard error).
- **`.dailybot/disabled` present** → wire the step, but it stays silent for this
  repo by design. Note it; do not remove the file.

---

## 2. Install paths to OFFER (opt-in — never run without acceptance)

Let the developer choose; defer the verified CLI install + auth to the Dailybot
skill's own `shared/auth.md` flow.

| Want | Offer |
|------|-------|
| **Dailybot skill** (recommended — brings consent/auth + `report`) | `npx skills add DailybotHQ/agent-skill` · OpenClaw `openclaw skills install dailybot` · `git clone https://github.com/DailybotHQ/agent-skill.git` + `./setup.sh` |
| **Dailybot CLI only** (developer explicitly wants the binary) | `pip install dailybot-cli` (Py 3.10+) · `brew install dailybothq/tap/dailybot` (macOS) · `curl -sSL https://cli.dailybot.com/install.sh \| bash` **only with the skill's checksum/consent verification** |

> Prefer installing the **skill** — it owns the SHA-256-verified CLI install and
> the OTP/API-key auth flow. Only surface the raw CLI commands when the developer
> wants the CLI without the skill. Never recommend `curl ... | bash` unverified.

## 3. Auth — point at the Dailybot skill, do not reinvent

Do **not** prompt for email/OTP/API key, and do **not** store credentials. Tell
the developer the Dailybot skill drives this:

- `dailybot login` (email OTP), or `dailybot config key=...` / `DAILYBOT_API_KEY`.
- Full flow: the Dailybot skill's `shared/auth.md`. If they decline, skip
  reporting and continue.

---

## 4. Wire the OPTIONAL report step into DWP execution

The integration value: a **plan completion** emits a **milestone** report when
Dailybot is present. Reason the exact wording for the repo, then add a short,
clearly-optional note to the repo's reporting docs (the generated `AGENTS.md`
reporting section and/or `docs/AI_AGENT_COLLAB.md`). The shape to convey:

> **Optional — Dailybot reporting (best-effort, never blocks):** when the
> Dailybot skill/CLI is installed and authenticated, on **DWP plan completion**
> send a **milestone** report via the dailybot `report` sub-skill, describing
> what was built. If Dailybot is absent, unauthenticated, or unreachable — or if
> `.dailybot/disabled` is present — skip silently and continue. Reporting MUST
> NOT block `execute`.

Reference command shape (the actual content is reasoned from the work, not
templated; route through the `report` sub-skill when the skill is installed):

```bash
# Conditional + best-effort — only when the CLI is present and authed.
if command -v dailybot >/dev/null 2>&1 && [ ! -f .dailybot/disabled ]; then
  dailybot agent update "<what was built, in plain standup English>" \
    --milestone \
    --json-data '{"completed":["..."],"in_progress":[],"blockers":[]}' \
    --metadata '{"model":"<your-model>","repo":"<repo>","branch":"<branch>"}' \
    || echo "Dailybot report skipped (non-blocking)."  # never fail execute on this
fi
```

Decision notes:

- **Milestone vs regular:** plan completion → `--milestone`. A single mid-plan
  task, if reported at all, is a regular report (no `--milestone`).
- **Writing rules:** describe outcomes + why, English, 1–3 sentences. Never
  "completed a plan", never file paths / git stats / branch names / plan IDs.
  Let the dailybot `report` sub-skill enforce the style.
- **Identity (optional):** commit `.dailybot/profile.json` (or the
  gitignore-friendly `.dailybot_example/profile.json` template) so every
  contributor/agent signs the same way — credential-free, no `key` field.
- **Reconcile:** if the repo's DWP docs already mention a report step, correct or
  keep it; do not duplicate it.

---

## 5. Consent + never-block rules (do not violate)

- **Opt-in:** install nothing and write no identity without explicit acceptance.
- **Defer auth:** never prompt for or store credentials; point at the Dailybot
  skill's `shared/auth.md`.
- **Verified install only:** never recommend `curl ... install.sh | bash`
  without the skill's checksum/consent verification.
- **Never block:** the wired report step is best-effort; absence, auth failure,
  network errors, or `.dailybot/disabled` mean skip-and-continue — warn once, no
  retries, no diagnostic loop. `execute` always succeeds regardless.
- **Vendor-neutral:** never imply DWP requires Dailybot. A repo with zero addons
  is fully conformant.
