# Template — Dependency Upgrade Report (reasoning aid)

This is the **report shape** to produce after the upgrade flow. Fill it by
reasoning about what actually happened; keep the sections, drop rows that do not
apply. Do **not** auto-commit — surface this report and the diff, and let the
developer commit.

```markdown
# Dependency Upgrade Report

**Date:** <YYYY-MM-DD>
**Ecosystem(s):** <e.g. JS/TS (pnpm), Python (poetry)>
**Package manager(s) detected from:** <manifest + lockfile that decided it>

## Summary

- Upgraded: <N> dependencies across <M> batches
- Skipped / reverted: <N> (see below)
- Majors: <approved N / deferred N>

## Upgraded (by tier)

### Patch
- <pkg>: <old> → <new>

### Minor
- <pkg>: <old> → <new>

### Major (developer-approved)
- <pkg>: <old> → <new>

## Skipped / Reverted

- <pkg>: <old> → <new> — **reverted**; gate failed: `<command>` (<reason>)
- <pkg>: <old> → <new> — **deferred** (major, awaiting review)

## Validation

- Gate used (the repo's real commands): `<command set>`
- Result per accepted batch: ✅ pass

## Files changed

- <manifest> (e.g. package.json / pyproject.toml / Cargo.toml / go.mod)
- <lockfile> (e.g. pnpm-lock.yaml / poetry.lock / Cargo.lock / go.sum)

## Recommended follow-ups

- <e.g. revisit the deferred major once upstream X lands>
- Suggested commit: `chore(deps): upgrade <N> dependencies (patch + minor)`
```
