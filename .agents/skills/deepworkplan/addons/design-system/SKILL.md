---
name: deepworkplan-addon-design-system
description: Optional DeepWorkPlan addon that gives a frontend/UI repo a DESIGN.md (under docs/, indexed from AGENTS.md) — a Markdown design-system file any coding agent reads to generate UI consistent with the repo's OWN design system. Reasons about the repo's ACTUAL design tokens (CSS custom properties, Tailwind config, token files, component styles) rather than copying a brand file; documents colors & roles, typography, spacing/layout, elevation, shapes, components, responsive behavior, do's & don'ts, and an agent prompt guide; checks contrast (WCAG AA) and token integrity. Frontend-scoped and default-on when a UI/design system is detected (applied in trust mode, strongly recommended in guided mode; never offered for backend/CLI/library-only repos); never required for baseline conformance; reconciles an existing DESIGN.md instead of clobbering it. Use when the developer wants agents to produce on-brand, consistent UI for a frontend repo.
version: "2.7.0"
documentation_url: https://deepworkplan.com
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob, Edit, Write
metadata: {"openclaw":{"emoji":"🎨","homepage":"https://deepworkplan.com"}}
---

# DeepWorkPlan — Design-System Addon

Give a **frontend/UI repo** a **`DESIGN.md`** — living under **`docs/`** alongside
the repo's other specs and **indexed from `AGENTS.md`** — so any human or AI agent
generates UI that matches the repo's **own** design system, instead of the
unstyled, statistically-common defaults an agent falls back to with no guidance.
This is an **opt-in addon** — it is **never** required for a repo to be AI-first,
and it is **only** for repos with a real UI surface.

> ## The rule that overrides everything: REASON about the repo's tokens, then write
>
> A `DESIGN.md` is only useful if it reflects **this** repo. The first job is to
> **read the repo's real design source** — its stylesheet, CSS custom properties,
> Tailwind config, token files, and component styles (see `SPEC.md` §3–§5 and
> `templates/presets.md`) — then document those values. **Never paste a
> third-party brand's `DESIGN.md`** (a Stripe/Linear/etc. catalog entry) into the
> target repo: reference catalogs are inspiration for *structure*, never content.

## Read these first (all relative inside the skill)

- [`SPEC.md`](SPEC.md) — the normative (RFC-2119) contract: frontend-scope gate,
  canonical sections, reason-don't-copy, reconcile-don't-clobber, accessibility &
  token integrity, pragmatic-reference posture, validation step.
- [`templates/DESIGN.md.md`](templates/DESIGN.md.md) — the annotated `DESIGN.md`
  skeleton (each canonical section + how to fill it from the repo). The *shape* is
  fixed; the *content* is reasoned per repo.
- [`templates/presets.md`](templates/presets.md) — per-stack **reasoning presets**
  (Tailwind, CSS-variables/vanilla, component-library/design-tokens) — where to
  find tokens in each stack. A *starting checklist*, not an answer key —
  **detected reality wins**.
- [`templates/agent_prompt_guide.md`](templates/agent_prompt_guide.md) — the
  "Agent Prompt Guide" block to embed so downstream agents know how to follow
  `DESIGN.md`.
- [`templates/design-system-command.md`](templates/design-system-command.md) — the
  **optional** `/design-system` delegator this addon MAY install into the target
  repo's `.agents/commands/` (only when accepted and wanted).
- `../README.md` — the addon mechanism (opt-in, reconcile-don't-clobber, contract).

## When this runs

- From **`onboard` Phase 7b** — after the core AI-first scaffolding. This addon is
  **default-on when detected** (`SPEC.md` §3.1): when a frontend/UI surface **is**
  detected, `onboard` **applies** it in trust mode (and **strongly recommends** it
  in guided mode); when no UI surface is detected it is **not** offered. Either way
  the developer may decline and the repo stays baseline-conformant.
- **Directly** — `/deepworkplan-addon-design-system` on an already-onboarded repo
  to create or refresh `DESIGN.md`, or via the installed `/design-system`
  delegator if one was added.

## The flow

### Step 0 — Consent + frontend-scope gate
1. Confirm the developer wants a `DESIGN.md` (skip silently if declined — the repo
   stays baseline-conformant).
2. **Confirm the repo has a UI surface** (`SPEC.md` §3): look for stylesheets / CSS
   custom properties, a Tailwind config or `@theme` block, UI components
   (`.tsx`/`.vue`/`.svelte`/`.astro`), or a token/brand source. If there is **no**
   UI surface, **stop** and tell the developer this addon does not apply.

### Step 1 — Locate the design source (the part you MUST reason about)
Find where this repo's design values actually live, using `templates/presets.md`:

- **Tailwind** → `tailwind.config.*` or a Tailwind v4 `@theme {}` block in CSS:
  theme colors, font families, spacing, radius, screens.
- **CSS variables / vanilla** → `:root { --… }` custom properties in the global
  stylesheet; spacing/size scales; media-query breakpoints.
- **Component library / design tokens** → a `tokens.*` / `theme.*` export, a
  design-tokens JSON, or a Storybook/theme file.
- **Brand/style guide** → any `BRAND*.md` / `STYLE*.md` doc, plus accessibility
  rules documented in `AGENTS.md`/`CLAUDE.md`.

A repo MAY combine sources (a Tailwind config + a brand doc + CSS vars). Read all
that exist; **the real files win** over any preset assumption.

### Step 2 — Reason out each canonical section
Using `templates/DESIGN.md.md`, fill each section from the design source:
Overview/atmosphere · Color palette & roles (light + dark) · Typography · Layout &
spacing · Elevation & depth · Shapes/radius · Components (in terms of the tokens) ·
Responsive behavior · Do's & don'ts (incl. the repo's accessibility rules) · Agent
prompt guide. Express values as **named tokens with usage notes**; add a
machine-readable token block only if the repo already maintains structured tokens.
Flag any value you had to **infer** so a human can confirm it.

### Step 3 — Write or reconcile `DESIGN.md`, then index it in `AGENTS.md`
- Choose the location (`SPEC.md` §2): if the repo has a `docs/` tree (DWP-native),
  write **`docs/DESIGN.md`** alongside the other specs; if it has no `docs/` tree,
  write `./DESIGN.md` at the root.
- If no `DESIGN.md` exists → write it at the chosen location.
- If one already exists → **reconcile additively** (`SPEC.md` §6): keep working
  values, add missing canonical sections, and ask before any destructive change.
- **Index it in `AGENTS.md`** (and therefore `CLAUDE.md`): add a reference to
  `DESIGN.md` in the documentation index so agents discover it like the other
  `docs/` specs. This pointer — not the physical location — is what guarantees
  discovery (`SPEC.md` §2).

### Step 4 — Validate (the gate)
Run the validation step (`SPEC.md` §11):
- `DESIGN.md` exists at the chosen location (`docs/DESIGN.md` or root) with all
  canonical sections, and **`AGENTS.md` references it**.
- Every documented value traces to the real design source (spot-check a few
  against the stylesheet/config); inferred values flagged.
- Documented text-color pairings meet **WCAG AA** contrast; token references
  resolve (no orphans/broken refs).
- File is Markdown-first and compact (~2–5K tokens); no build dependency added.

### Step 5 — (Optional) install the `/design-system` delegator
If the developer wants a one-command refresh later, install a `/design-system`
delegator into the repo's `.agents/commands/` (template:
`templates/design-system-command.md`) that re-runs this addon. Skip if not wanted —
a declined command leaves a baseline-conformant repo.

## Failure-mode guardrails

- **Never required, never blocking.** If the developer declines, stop cleanly.
- **Frontend only.** Skip for backend/CLI/non-UI repos — applying it there is a defect.
- **Reason about the tokens.** Document the repo's real values; never paste a brand file.
- **Reconcile, don't clobber.** Preserve a working `DESIGN.md`; ask before destructive edits.
- **Protect accessibility.** Capture the repo's contrast rules; don't document failing pairings.
- **Reference, don't hard-bind.** Follow the convention's shape, not its Alpha format details.
