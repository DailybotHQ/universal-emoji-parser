#!/usr/bin/env bash
# context.sh — shared context detection for all DeepWorkPlan sub-skills.
#
# Detects the current repository context and resolves where Deep Work Plan
# outputs live (.dwp/). Emits a single-line JSON object that sub-skills can read.
# Compatible with: Claude Code, Codex CLI, Cursor, Gemini CLI, OpenClaw,
# Windsurf, bare shell.
#
# Usage:  bash context.sh
# Output: {"repo":"...","repo_root":"...","branch":"...","agent_tool":"...","dwp_dir":"..."}
#
# Contract:
#   - repo_root : the repository root (git toplevel if available, else $PWD).
#   - repo      : the repo name (from `git remote get-url origin`, else the
#                 basename of repo_root).
#   - branch    : current git branch, or "unknown" outside a git work tree.
#   - agent_tool: the AI coding agent in use, detected from vendor env vars
#                 (DWP_AGENT_TOOL override > harness env vars > "unknown").
#   - dwp_dir   : the .dwp/ output location. Default "<repo_root>/.dwp".
#                 Overridable via the DWP_DIR env var. See shared/dwp-paths.md.
#
# Bash 3.2 compatibility (macOS default): NO mapfile/readarray, NO `declare -A`
# associative arrays, NO `${var^^}`/`${var,,}` case conversion.

set -euo pipefail

# ── Repo root ────────────────────────────────────────────────────────────────
REPO_ROOT=""
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
fi
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$PWD"
fi

# ── Repo name ────────────────────────────────────────────────────────────────
REPO=""
REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE" ]; then
  REPO="${REMOTE##*/}"
  REPO="${REPO%.git}"
fi
if [ -z "$REPO" ]; then
  REPO=$(basename "$REPO_ROOT")
fi

# ── Branch ───────────────────────────────────────────────────────────────────
BRANCH=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$BRANCH" ]; then
  BRANCH="unknown"
fi

# ── Agent detection ──────────────────────────────────────────────────────────
# Priority: explicit override > vendor env vars > "unknown".
AGENT_TOOL="unknown"
if [ -n "${DWP_AGENT_TOOL:-}" ]; then
  AGENT_TOOL="$DWP_AGENT_TOOL"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}${CLAUDECODE:-}" ]; then
  AGENT_TOOL="claude-code"
elif [ -n "${CODEX_SESSION_ID:-}${CODEX_HOME:-}" ]; then
  AGENT_TOOL="codex-cli"
elif [ -n "${CURSOR_SESSION_ID:-}${CURSOR_TRACE_ID:-}" ]; then
  AGENT_TOOL="cursor"
elif [ -n "${OPENCLAW_SESSION:-}" ]; then
  AGENT_TOOL="openclaw"
elif [ -n "${GEMINI_SESSION_ID:-}" ]; then
  AGENT_TOOL="gemini-cli"
elif [ -n "${WINDSURF_SESSION_ID:-}" ]; then
  AGENT_TOOL="windsurf"
fi

# ── .dwp/ location ───────────────────────────────────────────────────────────
# Default to <repo_root>/.dwp; override via DWP_DIR. See shared/dwp-paths.md.
DWP_DIR="${DWP_DIR:-$REPO_ROOT/.dwp}"

# ── Output (single-line JSON) ────────────────────────────────────────────────
# Emits compact JSON assuming paths and names without embedded quotes (true for
# git repos and branch names); a consumer needing hardened escaping can pipe
# through jq/python3.
printf '{"repo":"%s","repo_root":"%s","branch":"%s","agent_tool":"%s","dwp_dir":"%s"}\n' \
  "$REPO" "$REPO_ROOT" "$BRANCH" "$AGENT_TOOL" "$DWP_DIR"
