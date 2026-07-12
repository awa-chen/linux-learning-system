# Penguin Path - Memory Cloud Backup (zero-dependency, pure ASCII)
# Packs workspace memory + key config + learning system into a dated zip,
# uploads to Tencent SMH cloud (viewable in QClaw Mini Program, 30-day retention).
# Usage: powershell -ExecutionPolicy Bypass -File tools/backup-memory.ps1
# Deps: cloud-upload-backup skill scripts/windows/cloud_backup.cmd (verified working)

$ErrorActionPreference = "Continue"
$WS = "C:\Users\AWA\.qclaw\workspace"
$TS = (Get-Date).ToString("yyyy-MM-dd")
$ZIP = "$env:TEMP\qclaw-memory-$TS.zip"
$SKILL = "C:\Users\AWA\.qclaw\skills\cloud-upload-backup\scripts\windows\cloud_backup.cmd"

$items = @()
if (Test-Path "$WS\MEMORY.md")             { $items += "$WS\MEMORY.md" }
if (Test-Path "$WS\memory")                { $items += "$WS\memory" }
if (Test-Path "$WS\AGENTS.md")             { $items += "$WS\AGENTS.md" }
if (Test-Path "$WS\SOUL.md")               { $items += "$WS\SOUL.md" }
if (Test-Path "$WS\USER.md")               { $items += "$WS\USER.md" }
if (Test-Path "$WS\TOOLS.md")              { $items += "$WS\TOOLS.md" }
if (Test-Path "$WS\DISPATCH-TRIGGER.md")   { $items += "$WS\DISPATCH-TRIGGER.md" }
if (Test-Path "$WS\linux-learning-system") { $items += "$WS\linux-learning-system" }

if ($items.Count -eq 0) { Write-Output "ERR: nothing to backup, exit."; exit 1 }

if (Test-Path $ZIP) { Remove-Item $ZIP -Force }
Compress-Archive -Path $items -DestinationPath $ZIP -Force
Write-Output ("[OK] packed: " + $ZIP + " (" + (Get-Item $ZIP).Length + " bytes, " + $items.Count + " items)")

if (-not (Test-Path $SKILL)) { Write-Output ("ERR: cloud skill missing: " + $SKILL); exit 1 }

$out = cmd /c "$SKILL upload --local-path $ZIP --conflict-strategy overwrite 2>&1" | Out-String
Write-Output $out

# keep local zips for 7 days as a second fallback, then clean older
Get-ChildItem "$env:TEMP\qclaw-memory-*.zip" | Where-Object {
  $_.LastWriteTime -lt (Get-Date).AddDays(-7)
} | Remove-Item -Force

if ($out -match '"success"\s*:\s*true') {
  Write-Output "[RESULT] cloud backup OK - view in QClaw Mini Program (30-day retention)"
} else {
  Write-Output "[RESULT] cloud backup FAILED - see above"
}
