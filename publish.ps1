# Publishes committed changes on main to this repository's GitHub Pages site.
# Usage: .\publish.ps1
[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'

$gh = (Get-Command gh -ErrorAction Stop).Source
$branch = git -C $PSScriptRoot branch --show-current
if ($LASTEXITCODE -ne 0) { throw 'Unable to read the current Git branch.' }
if ($branch -ne 'main') { throw 'Switch to main before publishing.' }
$changes = git -C $PSScriptRoot status --porcelain
if ($LASTEXITCODE -ne 0) { throw 'Unable to check the Git working tree.' }
if ($changes) { throw 'Commit or stash your changes before publishing. Only committed changes are published.' }

# Use the personal account's gh login only for this script; the active gh account and global git config stay untouched.
$helper = "!'" + ($gh -replace '\\', '/') + "' auth git-credential"
$previousToken = $env:GH_TOKEN
try {
  $token = & $gh auth token --hostname github.com --user sunliangqin
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($token)) {
    throw 'Unable to authenticate as sunliangqin. Run gh auth login first.'
  }
  $env:GH_TOKEN = $token
  git -C $PSScriptRoot -c credential.helper= -c "credential.helper=$helper" push 'https://github.com/sunliangqin/sweet-saga.git' 'main:main'
  if ($LASTEXITCODE -ne 0) { throw 'Publishing failed: Git push was unsuccessful.' }
  'Push complete. GitHub Pages deploys main automatically; allow a few minutes for updates.'
} finally {
  $env:GH_TOKEN = $previousToken
}
'Play: https://sunliangqin.github.io/sweet-saga/'
