param([string]$Only = "")

$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"
$Python = ".\.venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $Python)) {
  throw "Missing .venv. Create the Python 3.12 environment first."
}

function Assert-LastExitCode([string]$Step) {
  if ($LASTEXITCODE -ne 0) {
    throw "$Step failed with exit code $LASTEXITCODE"
  }
}

if ($Only -eq "" -or $Only -eq "lint") {
  & $Python scripts/ascii_contract_check.py
  Assert-LastExitCode "ASCII/header contract check"
  $Linter = ".\.venv\Scripts\genvm-lint.exe"
  if (Test-Path -LiteralPath $Linter) {
    & $Linter check contracts/labelscope_market.py
    Assert-LastExitCode "GenVM lint"
  } elseif (Get-Command genvm-lint -ErrorAction SilentlyContinue) {
    genvm-lint check contracts/labelscope_market.py
    Assert-LastExitCode "GenVM lint"
  } else {
    throw "genvm-lint is not installed"
  }
}

if ($Only -eq "" -or $Only -eq "test") {
  & $Python -m pytest tests/direct -v
  Assert-LastExitCode "Direct contract tests"
}

if ($Only -eq "" -or $Only -eq "deployment") {
  & $Python -m pytest tests/test_deployment_receipts.py -v
  Assert-LastExitCode "Deployment parser tests"
  node --test tests/studionet_script.test.mjs
  Assert-LastExitCode "Studionet script tests"
}

if ($Only -eq "") {
  npm --workspace frontend/labelscope run lint
  Assert-LastExitCode "Frontend TypeScript"
  npm --workspace frontend/labelscope run test
  Assert-LastExitCode "Frontend tests"
  npm --workspace frontend/labelscope run build
  Assert-LastExitCode "Frontend production build"
}
