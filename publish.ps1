# Publishes the current index.html to the public GitHub Pages site.
#   Source (private): https://github.com/sunliangqin/sweet-saga
#   Site   (public) : https://github.com/sunliangqin/sweet-saga-web  ->  https://sunliangqin.github.io/sweet-saga-web/
# Usage:  .\publish.ps1            (or  .\publish.ps1 -Message "Describe the update")
param([string]$Message = "Publish $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
$ErrorActionPreference = 'Stop'

$gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
if (-not $gh) { $gh = 'C:\Program Files\GitHub CLI\gh.exe' }
$site = 'sunliangqin/sweet-saga-web'
$tmp = Join-Path $env:TEMP ('sweet-saga-web-' + [guid]::NewGuid().ToString('N'))
# Use the personal account's gh login only for this script; the active gh account and global git config stay untouched.
$helper = "!'" + ($gh -replace '\\', '/') + "' auth git-credential"
$env:GH_TOKEN = & $gh auth token --user sunliangqin
try {
  git -c credential.helper= -c "credential.helper=$helper" clone --quiet --depth 1 "https://github.com/$site.git" $tmp
  Copy-Item (Join-Path $PSScriptRoot 'index.html') (Join-Path $tmp 'index.html') -Force
  Push-Location $tmp
  try {
    git add index.html
    if (git status --porcelain) {
      git commit --quiet -m $Message
      git -c credential.helper= -c "credential.helper=$helper" push --quiet
      'Published. GitHub Pages usually refreshes within a minute.'
    } else { 'The site is already up to date.' }
  } finally { Pop-Location }
} finally {
  Remove-Item Env:GH_TOKEN -ErrorAction SilentlyContinue
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}
'Play: https://sunliangqin.github.io/sweet-saga-web/'
