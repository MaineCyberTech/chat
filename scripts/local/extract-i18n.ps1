param(
  [string]$SourceDir = "apps/web",
  [string]$OutputFile = "apps/web/lib/i18n/en.json"
)

Write-Host "=== i18n Extraction Script ===" -ForegroundColor Cyan
Write-Host "Scanning $SourceDir for t() calls..."

# Find all t() calls in the source (simple grep approach)
$files = Get-ChildItem -Path $SourceDir -Recurse -Include "*.tsx", "*.ts" | Where-Object {
  $_.FullName -notmatch "node_modules|\.turbo|dist|\.next"
}

$foundKeys = [System.Collections.Generic.HashSet[string]]::new()
$pattern = 't\("([^"]+)"'

foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw
  $matches = [regex]::Matches($content, $pattern)
  foreach ($m in $matches) {
    if ($m.Groups[1].Value) {
      [void]$foundKeys.Add($m.Groups[1].Value)
    }
  }
}

Write-Host "Found $($foundKeys.Count) unique translation keys in source."

# Load existing translations
$existing = @{}
if (Test-Path $OutputFile) {
  $existingJson = Get-Content $OutputFile -Raw | ConvertFrom-Json
  $existing = ConvertTo-HashTable $existingJson
}

# Merge: add missing keys with placeholder values
$merged = $existing.Clone()
$missingKeys = @()
foreach ($key in $foundKeys) {
  $parts = $key.Split(".")
  if ($parts.Length -lt 2) { continue }
  $section = $parts[0]
  $subKey = $parts[1..($parts.Length - 1)] -join "."
  if (-not $merged.ContainsKey($section)) {
    $merged[$section] = @{}
    $missingKeys += $key
  }
  if (-not ($merged[$section] -is [hashtable]) -or -not $merged[$section].ContainsKey($subKey)) {
    $missingKeys += $key
    if ($merged[$section] -is [hashtable]) {
      $merged[$section][$subKey] = "TODO: $key"
    }
  }
}

if ($missingKeys.Count -gt 0) {
  Write-Host "Missing $($missingKeys.Count) keys:" -ForegroundColor Yellow
  foreach ($k in $missingKeys) { Write-Host "  - $k" -ForegroundColor Gray }
}

# Convert back to JSON
function ConvertTo-JsonRecursive {
  param($InputObject)
  if ($InputObject -is [hashtable]) {
    $ordered = New-Object System.Collections.Specialized.OrderedDictionary
    foreach ($key in ($InputObject.Keys | Sort-Object)) {
      $ordered[$key] = ConvertTo-JsonRecursive $InputObject[$key]
    }
    return $ordered
  }
  return $InputObject
}

$ordered = ConvertTo-JsonRecursive $merged
$json = $ordered | ConvertTo-Json -Depth 10
Set-Content -Path $OutputFile -Value $json -Encoding UTF8

Write-Host "Updated $OutputFile with $($merged.Count) sections." -ForegroundColor Green
Write-Host "Done." -ForegroundColor Cyan
