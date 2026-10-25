#!/usr/bin/env bash
# Runs everything that backs the post's claims. Exits non-zero if anything fails.
set -euo pipefail
cd "$(dirname "$0")"

echo "dotnet-long-id-angular-demo - checking the post's claims"
echo "  1. .NET tests: the JSON the API writes, the way back, the global setting, OpenAPI"
echo "  2. Node: JSON.parse rounds the ID; the source-text reviver keeps it"
echo "  3. TypeScript 6 needs a small declaration for the reviver's third argument"
echo "  4. Angular build + Playwright in Chromium: what HttpClient hands the page"
echo

dotnet test LongIdDemo.slnx --logger "console;verbosity=normal"
(cd client && npm ci --no-audit --no-fund)
node node-checks/parse.mjs
node node-checks/ts-types.mjs
(cd client && npx ng build && npx playwright test)
