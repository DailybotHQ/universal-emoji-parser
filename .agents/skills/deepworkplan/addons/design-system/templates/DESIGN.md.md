# Reasoning template — `DESIGN.md` skeleton

This is the **annotated skeleton** the addon fills by **reasoning about the target
repo's real design source** (stylesheet, Tailwind config, token files, component
styles). The *shape* below is fixed; every *value* is derived from the repo — see
`SPEC.md` §4–§5. Replace each `> how to fill` note with real content and delete the
notes. Keep the result compact (~2–5K tokens) and Markdown-first.

> **Do not** paste a third-party brand's `DESIGN.md` here. Reference catalogs are
> inspiration for structure only.

---

```markdown
# DESIGN.md — {Project} design system

> Design-system context for AI coding agents. When generating or editing UI in
> this repo, follow this file. Prefer the named tokens below over ad-hoc values.

## Overview
> how to fill: one short paragraph — brand personality, tone, the design's intent.
> Pull from the brand/style guide if one exists; otherwise infer from the UI and flag it.

## Colors
> how to fill: read the real palette (Tailwind theme colors / CSS `--` vars / token
> file). List SEMANTIC roles + values + usage. Include dark-mode variants if the repo
> supports dark mode. Note which pairings are for text (and their contrast).

| Token | Value (light) | Value (dark) | Role / usage |
|-------|---------------|--------------|--------------|
| `color.bg` | `#…` | `#…` | Page background |
| `color.text` | `#…` | `#…` | Primary body text |
| `color.accent` | `#…` | `#…` | Primary actions / links |
| `color.muted` | `#…` | `#…` | Secondary text (must meet WCAG AA) |
| … | | | |

## Typography
> how to fill: real font families + the type scale (size / weight / line-height) and
> when each level is used. Source: font config + heading/body styles.

| Level | Family | Size / weight / line-height | Used for |
|-------|--------|-----------------------------|----------|
| Display | `…` | `…` | Hero / h1 |
| Heading | `…` | `…` | h2–h4 |
| Body | `…` | `…` | Paragraphs |
| Mono | `…` | `…` | Code |

## Layout & spacing
> how to fill: base spacing unit + steps, container/grid strategy, whitespace rules.

- Spacing scale: `{base}` → `{steps}`
- Container / grid: `…`
- Whitespace principle: `…`

## Elevation & depth
> how to fill: shadow/surface hierarchy, how depth is expressed (or "flat, hairline
> rules instead of shadows" if that's the system).

## Shapes
> how to fill: border-radius scale + corner language; border/hairline treatment.

## Components
> how to fill: the repo's key UI patterns described IN TERMS OF the tokens above,
> with interaction states. Cover the components that actually exist.

- **Button (primary):** bg `color.accent`, text `…`, radius `…`, states: hover `…`, focus `…`, disabled `…`
- **Input:** …
- **Card / surface:** …
- **Nav / header:** …

## Responsive behavior
> how to fill: real breakpoints (from the config) + touch-target expectations.

| Breakpoint | Min width | Notes |
|------------|-----------|-------|
| sm | `…` | |
| md | `…` | |
| lg | `…` | |

## Do's and Don'ts
> how to fill: explicit guardrails INCLUDING the repo's accessibility rules
> (approved/forbidden colors, contrast targets). Pull from AGENTS.md / CLAUDE.md.

- DO use the tokens above; DO keep text contrast at WCAG AA (4.5:1 / 3:1).
- DON'T introduce new colors/fonts outside this file.
- DON'T `{repo-specific forbidden patterns}`.

## Agent prompt guide
> how to fill: see templates/agent_prompt_guide.md — a short "how to use this file"
> block for downstream agents.
```

---

## After filling

Run the validation step (`SPEC.md` §11): all sections present; values traceable to
the repo; inferred values flagged; text pairings meet WCAG AA; token references
resolve; file compact and Markdown-first.
