# Preset — Flutter (Dart)

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `pubspec.yaml` at the repo root with `flutter:` under `dependencies` and an
  `sdk: flutter` line; `pubspec.lock` pins the resolved versions.
- `lib/main.dart` with a `void main() => runApp(...)` entry and a root widget
  (`MaterialApp`/`CupertinoApp`).
- Widgets extending `StatelessWidget`/`StatefulWidget`; `BuildContext`,
  `build()` methods.
- `analysis_options.yaml` (often `include: package:flutter_lints/flutter.yaml`
  or `package:lints/recommended.yaml`) — the analyzer/lint config.
- `test/` with `*_test.dart` files using `flutter_test` (`testWidgets`,
  `WidgetTester`); possibly `integration_test/` and `test/golden/` golden files.
- Platform folders: `android/`, `ios/`, and optionally `web/`, `macos/`,
  `linux/`, `windows/` (multi-platform target).

## What to look for in recon

- The **real** test command: `flutter test` (unit/widget) and any
  `flutter test integration_test/` or golden-test step. Test naming is
  `*_test.dart`. Capture verbatim.
- The **real** static-analysis gate: `flutter analyze` (or `dart analyze`)
  driven by `analysis_options.yaml`, plus `dart format --set-exit-if-changed .`.
- The **real** build target(s): `flutter build apk`/`appbundle`/`ipa`/`web` —
  which platforms ship, and any flavor/`--dart-define` config.
- **State management** if present: Provider (`provider`), Riverpod
  (`flutter_riverpod`, `@riverpod`), or Bloc (`flutter_bloc`, `Cubit`/`Bloc`).
  **Confirm which — it shapes the generated skills.**
- **Code generation** if present: `build_runner` with `json_serializable`,
  `freezed`, `riverpod_generator`, or `*.g.dart`/`*.freezed.dart` files →
  a `dart run build_runner build --delete-conflicting-outputs` step.

## Stack-specific skills/agents/commands to generate

- Skills: `widget` (widget + widget test), `screen`/`page` (route + screen),
  `model` (data class + `fromJson`/`toJson`, with codegen if `json_serializable`),
  and a state-shaped skill matching the library — `provider`/`riverpod-provider`/
  `bloc-feature`.
- Agents: baseline + a `widget-author` / `frontend-reviewer` persona aware of
  the widget tree, rebuild/`const` performance, and the chosen state pattern.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — widget/screen structure under `lib/`, the state-management
  approach, the data/repository layer, navigation, platform targets.
- `STANDARDS.md` — widget conventions (`const` constructors, composition over
  inheritance), file/feature layout, the analyzer ruleset.
- `TESTING_GUIDE.md` — `flutter_test` unit/widget tests, `WidgetTester` pumping,
  golden tests if used, the real `*_test.dart` pattern, mocking.
- Per-module docs: per feature folder under `lib/` (its widgets, screens,
  models, providers/blocs).

## Typical validation command (FIND the real one)

Commonly `flutter analyze && dart format --set-exit-if-changed . && flutter
test`, plus a `dart run build_runner build` step before tests if code
generation is used. **Do not assume** the state library, whether codegen runs,
or which platforms build — read `pubspec.yaml`, `analysis_options.yaml`, and CI
and capture the exact commands.
