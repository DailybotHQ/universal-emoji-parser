# SPEC.md — Design-System Addon (Normative)

## Abstract

This document is the **normative specification** of the DeepWorkPlan
**design-system addon**: an opt-in capability that gives a **frontend/UI
repository** a **`DESIGN.md`** — placed under **`docs/`** alongside the repo's
other specs and indexed from `AGENTS.md` — a Markdown design-system file that any
coding agent reads to generate UI **consistent with the repo's own design
system**. It defines the **frontend-scope gate** (RFC-2119), the **location +
`AGENTS.md` discovery** rule, the **canonical sections** a `DESIGN.md` MUST carry,
the **reason-don't-copy** rule, the
**reconcile-don't-clobber** behavior, the **pragmatic-reference** posture toward
the upstream convention, the **onboarding hook**, and the **validation** step.

The addon is **stack-aware**: it reasons about the repo's **actual** design tokens
(CSS custom properties, a Tailwind config, design-token files, component styles)
rather than copying a third-party brand file. It is governed by `../README.md` and
`methodology-spec/ADDONS.md`: it is **never** required for baseline AI-first
conformance — a repo with zero addons is fully conformant.

## Status of This Document

| Field | Value |
|-------|-------|
| **Version** | 2.0.0 |
| **Status** | Stable |
| **Companions** | `SKILL.md`, `templates/DESIGN.md.md`, `templates/presets.md`, `templates/agent_prompt_guide.md`, `../README.md`, `methodology-spec/ADDONS.md` |
| **License** | MIT |

## 1. Conventions

The RFC 2119 keywords (**MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**,
**MAY**, **OPTIONAL**) are interpreted as in
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

Throughout, **`DESIGN.md`** is the design-system file this addon produces (at
`docs/DESIGN.md` by default, §2); a **token** is a named design value (a color, a
type size, a spacing
step, a radius, an elevation); and the **design source** is the repo's real
origin of those values (a stylesheet, a Tailwind config, a token file, or the
component styles themselves).

---

## 2. What the Addon Provides

- The addon **MUST** produce a single **`DESIGN.md`** — a Markdown file,
  human-authorable and LLM-legible, that documents the repo's design system so an
  agent generating UI follows it instead of inventing statistically-common
  defaults. It **MUST** be version-controlled and reviewable in pull requests.
- **Location (DWP-native default):** in a repo that follows the DWP documentation
  standard — specs/docs centralized under `docs/` and indexed by `AGENTS.md` —
  `DESIGN.md` **SHOULD** live at **`docs/DESIGN.md`**, alongside the other specs
  (`ARCHITECTURE.md`, `STANDARDS.md`, `PRODUCT_SPEC.md`, …), **not** scattered at
  the root. A repo with **no** `docs/` tree (or one mirroring the upstream
  root convention) **MAY** instead place it at the repo root (`./DESIGN.md`).
- **Discovery is by reference, not by physical location.** Wherever it lives, the
  addon **MUST** ensure `AGENTS.md` (and therefore `CLAUDE.md`) **references**
  `DESIGN.md` in its documentation index, so any agent discovers it the same way it
  discovers the rest of the `docs/` specs. The location matters less than the
  `AGENTS.md` pointer being present.
- The file **SHOULD** stay compact (roughly 2–5K tokens) so it fits comfortably in
  an agent's context window alongside the task.
- The addon **MUST NOT** introduce a build dependency, a plugin, or an external
  source of truth; `DESIGN.md` is plain Markdown readable by any agent.

---

## 3. Frontend-Scope Gate (the part the addon reasons about)

- The addon is **frontend/UI-scoped**. It **MUST** be offered (and applied) only
  when the repo has a **user-facing UI surface**.
- The agent **MUST** detect frontend scope from **real files**, e.g.:

  | Signal | Example evidence |
  |--------|------------------|
  | Stylesheet / tokens | `*.css`, `*.scss`, CSS custom properties, a `tokens.*` / `theme.*` file |
  | Utility/theme config | `tailwind.config.*`, a Tailwind v4 `@theme` block in CSS, CSS-in-JS theme |
  | UI components | `.jsx`/`.tsx`/`.vue`/`.svelte`/`.astro` components, a component library |
  | Design assets | a brand/style guide doc, a design-tokens export, a Figma reference |

- A repo with **no** UI surface (a pure backend service, a CLI, a library with no
  rendered output) **MUST** have this addon **skipped**; applying it there is a
  defect.
- The addon is **archetype-agnostic** (`ARCHETYPES.md`): it MAY be layered onto an
  individual repo or onto a UI sub-repo of an orchestrator hub.

### 3.1 Recommendation Strength — Default-On When Detected

This addon is **conditionally default-on**: it is **never** part of the zero-addon
baseline (a repo with no addons is fully conformant — `ADDONS.md` §2), but when the
frontend-scope signal above **is** detected, onboarding **SHOULD** actively drive it
in, not merely list it:

- When a UI surface **is** detected:
  - In **trust mode**, the `onboard` flow **SHOULD apply** the addon automatically
    (generate `DESIGN.md`), the same way it applies other detected-and-applicable
    setup — the developer **MAY** still decline.
  - In **guided mode**, the flow **MUST** present it as a **strong recommendation**
    and ask before applying.
- When a UI surface is **not** detected, the flow **MUST NOT** offer it.
- Declining **MUST** always remain possible, and a declined addon **MUST** leave a
  fully baseline-conformant repo. "Default-on when detected" raises the *default*,
  it does **not** make the addon mandatory.

This places `design-system` in the **strongest conditional tier** among the addons:
weaker than the stack-agnostic baseline (which it is not part of), but stronger than
a neutral opt-in — because a repo that *has* a design system almost always benefits
from capturing it as `DESIGN.md`.

---

## 4. Canonical Sections of `DESIGN.md`

A conformant `DESIGN.md` **MUST** contain the following sections (titles MAY be
adapted to the repo's voice; the substance MUST be present). Each section is
**filled by reasoning about the design source**, never copied from a brand file.

1. **Overview / Atmosphere** — brand personality, emotional tone, the design's
   intent in one short paragraph.
2. **Color Palette & Roles** — semantic colors (primary, secondary, neutral,
   surface, accent, state colors) with values **and** their functional role; light
   and dark variants where the repo supports dark mode.
3. **Typography** — font families, the type scale (sizes/weights/line-heights), and
   when each level is used.
4. **Layout & Spacing** — the spacing scale (base unit + steps), grid/container
   strategy, and whitespace principles.
5. **Elevation & Depth** — shadow/surface hierarchy and how depth is expressed.
6. **Shapes** — border-radius scale and corner language; border/hairline treatment.
7. **Components** — the repo's key UI patterns (buttons, inputs, cards, nav, …)
   described in terms of the tokens above, including interaction states.
8. **Responsive Behavior** — breakpoints and touch-target expectations.
9. **Do's and Don'ts** — explicit guardrails for agent behavior, including
   **accessibility constraints** the repo enforces (see §7).
10. **Agent Prompt Guide** — a short "how to use this file" block telling a
    downstream agent to follow `DESIGN.md` and how to reference tokens.

- Color/spacing/type values **SHOULD** be expressed as **named tokens** with
  human-readable usage notes; the file **MAY** additionally carry a
  machine-readable token block (e.g. front matter) when the repo already maintains
  structured tokens, but a Markdown-first table is sufficient and preferred for
  authorability.

---

## 5. Reason, Don't Copy

- Every value in `DESIGN.md` **MUST** be **derived from the repo's real design
  source** — the stylesheet, Tailwind config, token files, or component styles
  that actually exist.
- The addon **MUST NOT** paste a third-party brand's `DESIGN.md` (e.g. a catalog
  entry for Stripe, Linear, or any other site) into the target repo. Reference
  catalogs are **inspiration for structure**, never the content.
- When a value is genuinely undefined in the repo, the addon **SHOULD** infer the
  most consistent value from existing usage and **MUST** flag it as inferred (so a
  human can confirm), rather than fabricate an unrelated value.

---

## 6. Reconcile, Don't Clobber

- If a `DESIGN.md` (or an equivalent design-token source) **already exists**, the
  addon **MUST** reconcile additively — preserving values that already work and
  bringing the rest toward the canonical-section shape.
- The addon **MUST NOT** overwrite or delete an existing `DESIGN.md` or token file
  wholesale. Per `AGENT_PROTOCOL.md`, any destructive change to an existing file
  **MUST** be approved by the developer first.
- The addon **MUST** record what it changed (added sections, reconciled values,
  inferred values flagged for confirmation).

---

## 7. Accessibility & Token Integrity

- The Do's and Don'ts section **MUST** capture the repo's **real accessibility
  rules** (e.g. WCAG AA contrast targets, approved/forbidden text colors) when the
  repo documents them, so agents do not regress contrast.
- Documented color pairings intended for text **SHOULD** meet **WCAG AA** contrast
  (4.5:1 normal, 3:1 large) and the addon **SHOULD** sanity-check the pairings it
  documents.
- Token references inside `DESIGN.md` **MUST** resolve — no orphaned or broken
  references (a component referencing a token that is not defined).

---

## 8. Pragmatic Reference, Not Hard Binding

- The addon **references** the emerging `DESIGN.md` convention (introduced by
  Google Stitch; popularized by community catalogs) as the **shape** to follow, but
  **MUST NOT** hard-bind to that convention's evolving/Alpha format details.
- DWP's `DESIGN.md` is **Markdown-first**; adopting any specific machine-readable
  token schema (e.g. W3C Design Tokens front matter) is **OPTIONAL** and applied
  only when it fits the repo.

---

## 9. Onboarding Hook + Optional `/design-system` Delegator

- The addon's onboarding hook (`SKILL.md`) is offered by `onboard` Phase 7b as an
  **opt-in** step, **only for frontend repos** (§3), and **MUST NOT** be applied
  without acceptance. A declined addon leaves a baseline-conformant repo.
- The addon **MAY** install a `/design-system` delegator command into the target
  repo's `.agents/commands/` (to regenerate/refresh `DESIGN.md` later; template:
  `templates/design-system-command.md`). Installing the command is **OPTIONAL**; a
  declined addon installs **no** command.

---

## 10. Relationship to Per-Feature Design Docs (positioning)

- This addon provides a **repo-level, persistent design-system file**. It is
  **distinct** from a **per-feature technical design document** (the
  "requirements → design → tasks" `design.md` of tool-bound spec-driven workflows).
- DeepWorkPlan deliberately does **not** ship a separate per-feature design-doc
  archetype: a DWP plan's README (Goal + Context), each task's Context and
  **Acceptance Criteria**, and the **validation gates** already fulfill the
  per-feature design role. This addon fills the one gap that role does not cover —
  durable, repo-native **UI** design context.

---

## 11. Validation Step (run after applying)

The addon is correctly applied when **all** hold:

1. The repo was confirmed to have a **frontend/UI surface** (§3); the addon was
   **skipped** for non-UI repos.
2. A `DESIGN.md` exists with all canonical sections (§4) — at **`docs/DESIGN.md`**
   for a repo with a `docs/` tree (DWP-native default), or at the repo root for a
   repo without one (§2).
3. **`AGENTS.md` references `DESIGN.md`** in its documentation index (so agents
   discover it like the other `docs/` specs) (§2).
4. Every documented value is **traceable to the repo's real design source** (§5);
   no third-party brand file was pasted; inferred values are flagged.
5. An **existing** `DESIGN.md`/token source, if present, was **reconciled** (§6),
   not clobbered; destructive changes were approved.
6. Documented text color pairings meet **WCAG AA**; token references **resolve**
   (no orphans/broken refs) (§7).
7. The file is Markdown-first and compact; no build dependency was introduced (§2).
8. If a `/design-system` delegator was offered and accepted, it exists in the
   repo's `.agents/commands/`; if declined, none was installed (§9).

---

## 12. References

- [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
- `SKILL.md` (the onboarding hook + flow), `templates/*` (reasoning aids)
- `../README.md` (addon mechanism), `methodology-spec/ADDONS.md` (concept + pointer)
- `AGENT_PROTOCOL.md` (approval gates), `ARCHETYPES.md` (archetypes)
- [W3C Design Tokens](https://www.w3.org/community/design-tokens/) (optional token schema)

---

*Part of the DeepWorkPlan methodology v2.0.0, MIT License, by [Dailybot](https://dailybot.com) / dailybotops.*
