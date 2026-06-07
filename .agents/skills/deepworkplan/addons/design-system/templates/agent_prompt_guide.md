# Reasoning template — the "Agent Prompt Guide" block

Every `DESIGN.md` ends with a short **Agent Prompt Guide**: a "how to use this file"
block that tells a downstream coding agent to follow the design system. Adapt the
wording to the repo, keep it to a few lines, and reference the repo's real token
names.

---

## Drop-in block (adapt the bracketed parts)

```markdown
## Agent prompt guide

**For coding agents working in this repo:** this `DESIGN.md` is the source of truth
for UI. Before generating or editing any UI:

1. **Use the named tokens** in this file (colors, type, spacing, radius) — do not
   introduce ad-hoc values or new colors/fonts outside it.
2. **Respect roles** — pick a color by its *role* (e.g. `color.accent` for primary
   actions), not by eyeballing a hex.
3. **Keep accessibility** — text pairings must meet the contrast targets in Do's &
   Don'ts; never use a forbidden color for body text.
4. **Match component patterns** — reuse the documented Button/Input/Card/Nav
   patterns and their interaction states.
5. **When something isn't covered**, choose the option most consistent with the
   tokens here and note the gap rather than inventing an unrelated style.

Suggested instruction to paste into an agent prompt:
> "Follow `DESIGN.md` strictly. Build [the UI] using its tokens, roles, and
>  component patterns; keep text contrast at WCAG AA."
```

---

## Notes

- Reference the repo's **actual** token names (e.g. `color.accent`, `--color-ink`,
  `oxblood`) so the guidance is concrete, not generic.
- If the repo installed a `/design-system` delegator, you MAY mention it here
  ("run `/design-system` to refresh this file after design changes").
- Keep this block short — its job is to point agents at the rest of the file, not to
  repeat it.
