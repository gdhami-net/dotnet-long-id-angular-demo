# Same as check.sh, for PowerShell. Exits non-zero if anything fails.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
function Step($cmd) { Write-Host "> $cmd"; Invoke-Expression $cmd; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }

Step 'dotnet test LongIdDemo.slnx --logger "console;verbosity=normal"'
Push-Location client; Step 'npm ci --no-audit --no-fund'; Pop-Location
Step 'node node-checks/parse.mjs'
Step 'node node-checks/ts-types.mjs'
Push-Location client; Step 'npx ng build'; Step 'npx playwright test'; Pop-Location
