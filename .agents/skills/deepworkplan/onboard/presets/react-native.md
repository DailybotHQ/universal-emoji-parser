# Preset — React Native / Expo (TypeScript)

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `react-native` in `package.json` `dependencies`, with `react` alongside it.
- **Expo managed**: `expo` in deps, an `app.json` or `app.config.ts`/`app.config.js`,
  an `expo` key, and often no committed `ios/`/`android/` folders.
- **Bare React Native**: committed `ios/` (with a `*.xcodeproj`/`Podfile`) and
  `android/` (with `build.gradle`) folders, a `react-native.config.js`. **Detect
  managed vs bare early — it changes nearly every command.**
- `metro.config.js`/`metro.config.cjs` (the bundler), `babel.config.js` with
  `babel-preset-expo` or `metro-react-native-babel-preset`.
- Navigation: React Navigation (`@react-navigation/*`) or **expo-router** (an
  `app/` directory with file-based routes, `expo-router` in deps).
- Package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` →
  yarn, `package-lock.json` → npm; Expo projects often pin via `expo install`.
  **Infer from the lockfile present.**
- Layout: `src/`/`app/` with `screens/`/`components/`, `navigation/`, `hooks/`,
  `services/`; `assets/` for fonts/images.

## What to look for in recon

- The **real** test setup: Jest (`jest.config.*` or a `jest` key,
  `jest-expo`/`react-native` preset) with `@testing-library/react-native`. Test
  files `*.test.tsx`/`*.test.ts` or under `__tests__/`. **Confirm the preset.**
- The **real** lint/type-check: `eslint` (`.eslintrc`/`eslint.config.js`,
  often `eslint-config-expo` or `@react-native`), `tsc --noEmit`/a `type-check`
  script, Prettier. Capture verbatim.
- The **real** run/build path, which depends on managed vs bare:
  - Expo managed: `expo start`, `expo prebuild`, and **EAS** (`eas build`,
    `eas.json`) for store builds.
  - Bare RN: `npx react-native run-ios`/`run-android`, `pod install`,
    `xcodebuild`/Gradle for release builds.
- Native modules / config plugins (Expo `plugins`), and where secrets/env live
  (`.env`, `app.config.ts` `extra`, EAS secrets).

## Stack-specific skills/agents/commands to generate

- Skills: `screen` (screen + navigation entry + test), `component` (RN component +
  test), `hook` (custom hook), `navigator`/`route` (React Navigation stack or an
  expo-router file), `native-module` only if bare RN with custom native code.
- Agents: baseline + a `mobile-author` / `frontend-reviewer` persona aware of
  the managed-vs-bare split, platform branches (iOS/Android), and list/perf
  pitfalls (FlatList, memoization).
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — screen/navigation structure (React Navigation vs
  expo-router), state, the native config (managed vs bare), EAS pipeline.
- `STANDARDS.md` — component/screen conventions, styling approach
  (`StyleSheet`/styled), platform-specific files (`*.ios.tsx`/`*.android.tsx`).
- `TESTING_GUIDE.md` — Jest + `@testing-library/react-native`, the preset,
  the real `*.test.tsx` pattern, mocking native modules.
- Per-module docs: per feature folder (its screens, navigators, hooks, services).

## Typical validation command (FIND the real one)

Commonly `npm run lint && npm run type-check && npm test` (or the
pnpm/yarn equivalent). The **build/run** command is managed-vs-bare specific
(`expo start`/`eas build` vs `npx react-native run-ios`/Gradle). **Do not
assume** the package manager, the preset, or whether it's managed or bare —
read `package.json`, `app.json`/`app.config.*`, check for `ios/`/`android/`,
and capture the exact commands.
