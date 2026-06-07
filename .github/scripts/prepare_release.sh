#!/bin/bash
# Bumps the patch version in package.json, then commits and tags explicitly.
#
# Bumps the version with Node directly instead of `pnpm version` because pnpm v11.x
# runs `git status --porcelain` upfront and fails with ERR_PNPM_UNCLEAN_WORKING_TREE
# when the working tree has transient artifacts — which happens in CI after
# `pnpm install --frozen-lockfile` triggers install scripts (e.g. esbuild postinstall).
# The Node bump only touches package.json and is safe regardless of untracked state.
#
# Preserves the historical release commit message and tagging used by the
# release_and_publish workflow: "[🤖 DailyBot] New release to vX.Y.Z launched 🚀".
set -euo pipefail

# Refuse to release if TRACKED files have uncommitted changes (untracked/gitignored
# build artifacts like dist/ are fine).
if ! git diff --quiet HEAD -- .; then
  echo "Tracked files have uncommitted changes. Refusing to prepare a release."
  git status --short --untracked-files=no
  exit 1
fi

VERSION=$(node -e "
const fs = require('node:fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);
pkg.version = \`\${major}.\${minor}.\${patch + 1}\`;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(pkg.version);
")
TAG="v${VERSION}"
RELEASE_MESSAGE="[🤖 DailyBot] New release to ${TAG} launched 🚀"

git add package.json
if [[ -f "pnpm-lock.yaml" ]]; then
  git add pnpm-lock.yaml
fi

if git diff --cached --quiet; then
  echo "No release metadata changes staged."
  exit 1
fi

git commit -m "${RELEASE_MESSAGE}"
git tag -a "${TAG}" -m "${TAG}"
