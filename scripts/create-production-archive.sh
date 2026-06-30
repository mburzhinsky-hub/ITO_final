#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/vizhu-calculator-production.zip}"
cd "$ROOT"
rm -f "$OUT"
zip -qr "$OUT" \
  index.html package.json README.md \
  src public \
  -x "**/*.log" "**/*.tmp" "**/*.bak" "**/*.backup" "node_modules/**" "coverage/**"
echo "$OUT"
