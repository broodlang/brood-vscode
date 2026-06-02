#!/usr/bin/env bash
# Build, package, and (re)install the Brood extension into your local VS Code.
# Usage: npm run reinstall   (or: scripts/reinstall.sh)
#
# Requires the `code` CLI on PATH (VS Code: Command Palette ->
# "Shell Command: Install 'code' command in PATH"). After it runs, reload the
# window (Ctrl+Shift+P -> "Developer: Reload Window") to pick up the new build.
set -euo pipefail

cd "$(dirname "$0")/.."

name=$(node -p "require('./package.json').name")
version=$(node -p "require('./package.json').version")
vsix="${name}-${version}.vsix"

echo "==> Type-checking and bundling"
npm run compile

echo "==> Packaging ${vsix}"
npx vsce package -o "${vsix}"

if ! command -v code >/dev/null 2>&1; then
  echo "!! 'code' CLI not found on PATH."
  echo "   Install it from VS Code: Command Palette -> \"Shell Command: Install 'code' command in PATH\"."
  echo "   Then run: code --install-extension ${vsix} --force"
  exit 1
fi

echo "==> Installing ${vsix}"
code --install-extension "${vsix}" --force

echo "==> Done. Reload VS Code (Ctrl+Shift+P -> \"Developer: Reload Window\") to apply."
