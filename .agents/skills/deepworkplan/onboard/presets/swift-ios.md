# Preset — Swift / iOS

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- An `*.xcodeproj` and/or `*.xcworkspace` at the repo root (a workspace usually
  means CocoaPods or multiple projects), and `*.swift` source files.
- **Dependency manager** — detect which:
  - `Package.swift` → **SwiftPM** (and `Sources/`, `Tests/` per the SPM layout).
  - `Podfile` + `Podfile.lock` → **CocoaPods** (open the `.xcworkspace`, run
    `pod install`).
  - `Cartfile` → **Carthage** (rarer).
  **Infer from the files present.**
- `*.xcodeproj/project.pbxproj` (targets, schemes), `Info.plist`, `*.entitlements`,
  and an `xcschemes` set under `*.xcodeproj/xcshareddata/`.
- **UI layer** — detect which:
  - SwiftUI: types conforming to `View`, a `body: some View`, `@State`/
    `@StateObject`/`@Observable`, an `App` struct with `@main`.
  - UIKit: `UIViewController`/`UIView` subclasses, `*.storyboard`/`*.xib`,
    `AppDelegate`/`SceneDelegate`.
  **Confirm SwiftUI vs UIKit — it changes nearly every screen-level skill.**
- Layout: `Sources/`/an app target folder with feature groups, `Models/`,
  `Views/`, `ViewModels/` (MVVM is common), `Resources/`, `Tests/`/`*Tests/`.

## What to look for in recon

- The **real** test command: `xcodebuild test -scheme <Scheme> -destination
  'platform=iOS Simulator,name=...'` (app projects) vs `swift test` (an SPM
  library). Tests use **XCTest** (`XCTestCase`, `func test...`) and possibly
  the newer **Swift Testing** (`import Testing`, `@Test`). **Confirm which.**
- The **real** lint/format gate: **SwiftLint** (`.swiftlint.yml`, `swiftlint`)
  and/or **swift-format** (`.swift-format`, `swift format lint`). Capture
  verbatim, and note if it runs as an Xcode build phase.
- The **real** build: `xcodebuild -scheme <Scheme> build` / `swift build`, the
  scheme and destination, and any `fastlane` lanes (`fastlane/Fastfile`) wrapping
  build/test/release.
- The dependency manager — it changes setup (`pod install` /
  `swift package resolve`) and whether you open the project or the workspace.
- Where signing/secrets live (provisioning profiles, `*.entitlements`, fastlane
  match, CI secrets) — flag, don't touch.

## Stack-specific skills/agents/commands to generate

- Skills: a UI-shaped skill matching the layer — `swiftui-view` (View +
  preview + test) or `uikit-screen` (view controller + test); `viewmodel`
  (if MVVM), `model` (Codable type + test), `service`/`networking-client`.
- Agents: baseline + a `swift-author` / `ios-reviewer` persona aware of the
  SwiftUI-vs-UIKit split, value-vs-reference types, optional handling, and
  concurrency (`async`/`await`, actors, `@MainActor`).
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — SwiftUI vs UIKit, the app/scene lifecycle, the
  architecture pattern (MVVM/TCA/MVC), navigation, the networking/data layer,
  the dependency manager.
- `STANDARDS.md` — Swift conventions (value types, optionals, access control,
  `async`/`await`), file/feature layout, the SwiftLint/swift-format ruleset.
- `TESTING_GUIDE.md` — XCTest (or Swift Testing), the scheme/destination to run,
  the real `*Tests.swift` pattern, mocking via protocols, UI tests if present.
- Per-module docs: per feature group (its views/view controllers, view models,
  models, services).

## Typical validation command (FIND the real one)

For an app project, commonly `swiftlint && xcodebuild test -scheme <Scheme>
-destination 'platform=iOS Simulator,name=iPhone 15'` (often wrapped in a
fastlane lane or a `Makefile`); for an SPM library, `swift build && swift
test`. **Do not assume** the dependency manager, the UI layer, the scheme, or
whether fastlane wraps it — read `Package.swift`/`Podfile`, the `*.xcodeproj`
schemes, any `Fastfile`, and CI, and capture the exact commands.
