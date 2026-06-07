# Reasoning presets — where a repo's design tokens live

Match the row(s) for the **detected stack** as a *starting checklist* for **where to
read** the repo's real design values, then verify every assumption against the
actual files. **Detected reality wins** — a repo may combine several sources.

> These presets tell you **where to look**, not **what to write**. The values you
> document come from the repo (`SPEC.md` §5), never from this file or a brand catalog.

---

## Tailwind (v3 config or v4 `@theme`)

- **Tokens:** `tailwind.config.{js,ts,cjs,mjs}` → `theme` / `theme.extend`
  (`colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `boxShadow`,
  `screens`). For **Tailwind v4**, read the `@theme { --color-…; --font-…; --spacing-…; }`
  block inside the global CSS instead of a JS config.
- **Dark mode:** `darkMode` strategy + `dark:` variants in components.
- **Breakpoints:** `theme.screens` (or `@theme` `--breakpoint-*`).
- **Components:** utility classes in the components reveal real button/input/card patterns.

## CSS variables / vanilla / SCSS

- **Tokens:** `:root { --… }` (and a `.dark`/`[data-theme]` block) in the global
  stylesheet — colors, spacing, radius, shadows, font stacks.
- **Type scale:** heading/body rules; `clamp()` for fluid type.
- **Breakpoints:** `@media (min-width: …)` query values.
- **SCSS:** `$variables` / `@use` token partials (`_tokens.scss`, `_variables.scss`).

## Component library / design tokens

- **Tokens:** a `tokens.{json,ts,js}` / `theme.{ts,js}` export, a Style
  Dictionary / W3C design-tokens file, or a theme provider (`createTheme`, MUI
  theme, Chakra theme, styled-components `ThemeProvider`).
- **Components:** the library's component source + stories (Storybook) show variants
  and states; map these to the Components section.
- **Reference syntax:** if the repo already uses `{path.to.token}`-style refs, mirror
  that in `DESIGN.md`; otherwise plain named tokens are fine.

## Brand / style guide + accessibility rules

- **Brand doc:** any `BRAND*.md`, `STYLE*.md`, or design doc — use for the Overview
  / atmosphere and intent.
- **Accessibility:** contrast targets and approved/forbidden colors are often in
  `AGENTS.md` / `CLAUDE.md` / an accessibility doc — these feed the Do's & Don'ts.

---

## Cross-check before writing

1. Did you read the **actual** token source (not a guess)?
2. Are **dark-mode** values captured if the repo supports dark mode?
3. Do the **breakpoints** match the real config?
4. Are the **accessibility** rules reflected in Do's & Don'ts?
5. Are any **inferred** values flagged for human confirmation?
