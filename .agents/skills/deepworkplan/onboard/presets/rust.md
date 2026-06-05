# Preset — Rust (Cargo)

> Reasoning aid, not a template. Verify every assumption against the live repo;
> detected reality wins. Capture the **real** validation command, not the
> example below.

## Signals that identify this stack

- `Cargo.toml` and `Cargo.lock` at the repo (or crate) root; `Cargo.toml`
  declares `[package]`, `[dependencies]`, and often `[features]`.
- Entry point: `src/main.rs` (binary crate) or `src/lib.rs` (library crate);
  some crates ship both, plus extra binaries under `src/bin/`.
- Module tree under `src/` via `mod`/`pub mod` and `mod.rs` or `foo.rs`+`foo/`.
- **Workspace** monorepos: a root `Cargo.toml` with `[workspace]` and
  `members = [...]`, each member its own crate with its own `Cargo.toml`.
- Edition (`edition = "2021"/"2024"`) and an MSRV (`rust-version`) may be pinned;
  a `rust-toolchain.toml` may pin the toolchain. `build.rs` indicates a build
  script. **Read what's present** rather than assuming.

## What to look for in recon

- The **real** test command: `cargo test` (workspace-wide vs `-p <crate>`),
  whether `cargo nextest run` is used, and where tests live — inline
  `#[cfg(test)] mod tests` vs integration tests under `tests/` vs doctests.
- The **real** lint/format gate: `cargo clippy` (often `-- -D warnings` to fail
  on lints) and `cargo fmt --check` (or `cargo fmt -- --check`). Confirm whether
  CI denies warnings.
- The **real** build: `cargo build` vs `cargo build --release`; which features
  are enabled (`--all-features`, `--no-default-features`, specific `--features`).
- Feature flags and their meaning; `unsafe` blocks and FFI boundaries; any
  `build.rs` codegen. Async runtime if present (`tokio`/`async-std`).

## Stack-specific skills/agents/commands to generate

- Skills: `module-add` (new module + tests), `error-type` (define an error enum /
  `thiserror` variant), `crate-add` (new workspace member wired into `members`),
  optionally `bench` (criterion) and `feature-flag` (gate code behind a feature).
- Agents: baseline roles + an `ownership-reviewer` / `unsafe-auditor` persona
  aware of borrow/lifetime and `unsafe` safety invariants.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — crate/workspace boundaries, module tree, trait/ownership
  model, error-handling strategy (`Result`/`?`), async runtime if any.
- `TESTING_GUIDE.md` — unit (`#[cfg(test)]`) vs integration (`tests/`) vs
  doctests, how to scope a single crate (`-p`), fixtures/builders.
- `SECURITY.md` — `unsafe`/FFI boundaries and their invariants, dependency
  audit (`cargo audit`/`cargo deny`), secrets handling.
- Per-module docs: one per significant crate (workspace) or module group.

## Typical validation command (FIND the real one)

Often `cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo
test` (workspace-wide), with a separate `cargo build --release` for release
artifacts. **Do not assume** the feature set or whether warnings are denied —
read the `Makefile`/`justfile`/CI and capture the exact command.
