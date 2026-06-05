# Preset — Python package / CLI

> Reasoning aid, not a template. Verify against the live repo; detected reality
> wins. Capture the **real** validation command, not the example below.

## Signals that identify this stack

- `pyproject.toml` with a `[project.scripts]` (or legacy `console_scripts` in
  `setup.py`/`setup.cfg`) entry point → an installable CLI.
- A CLI framework in deps: `click`, `typer`, or stdlib `argparse`.
- An importable package layout: `src/<pkg>/` (src-layout) or `<pkg>/` at root,
  with `__init__.py`, a `cli.py`/`__main__.py`, and `commands/`/`subcommands/`.
- Packaging/build via `hatch`, `poetry`, `setuptools`, or `flit`; publishing to
  PyPI (a `twine`/build step in CI). Package manager from the lockfile present.

## What to look for in recon

- The **real** validation gate: `ruff check` / `flake8`, `black --check`,
  `mypy`, and the test command (`pytest`). Capture verbatim.
- Test convention: `tests/test_*.py` or co-located `*_test.py`; pytest fixtures.
- The console-script entry point name (the actual CLI command users type) and
  the command/subcommand structure.
- Whether it's published (PyPI) — drives a packaging/release doc emphasis and a
  `SECURITY.md` note on supply-chain (a public OSS surface).

## Stack-specific skills/agents/commands to generate

- Skills: `command-add` (add a top-level CLI command), `subcommand` (add a
  subcommand under an existing group), `option`/`flag` (add an option with help +
  test); optionally `release` (version bump + changelog + publish) if it ships to
  PyPI.
- Agents: baseline + a `cli-author` / `dx-reviewer` persona aware of help text,
  exit codes, and backward compatibility of the CLI surface.
- Commands: the five DWP commands + `code-review`, `pr`, `commit`.

## Doc emphases

- `ARCHITECTURE.md` — package layout, the command/subcommand tree, the public
  API surface vs internal modules.
- `STANDARDS.md` — public-API stability, help-text conventions, exit codes,
  error messages as a user-facing surface.
- `TESTING_GUIDE.md` — pytest patterns, CLI-runner testing (e.g. Click's
  `CliRunner`), coverage target.
- Per-module docs: per command group / major subpackage.

## Typical validation command (FIND the real one)

Commonly `ruff check . && mypy <pkg> && pytest`, or wrapped in a `make
lint test` / `hatch run` / `tox` target. **Do not assume** — read
`pyproject.toml`/Makefile/`tox.ini`/CI and capture the exact commands.
