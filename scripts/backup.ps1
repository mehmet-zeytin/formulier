$ErrorActionPreference = "Stop"

$ProjectRoot =
  "C:\Users\Eigenaar\Desktop\Bedrijf Project\werkorder-formulier"

$BackupDir =
  Join-Path $ProjectRoot "backups"

$UploadsDir =
  Join-Path $ProjectRoot "backend\uploads"

$Timestamp =
  Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

$MySqlDump =
  "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"

New-Item `
  -ItemType Directory `
  -Path $BackupDir `
  -Force |
  Out-Null

$DatabaseBackup =
  Join-Path `
    $BackupDir `
    "werkorder_db_$Timestamp.sql"

& $MySqlDump `
  --login-path=werkorder_backup `
  --no-tablespaces `
  --single-transaction `
  --default-character-set=utf8mb4 `
  --result-file="$DatabaseBackup" `
  werkorder_db

if ($LASTEXITCODE -ne 0) {
  Remove-Item `
    $DatabaseBackup `
    -ErrorAction SilentlyContinue

  throw "Database-back-up mislukt."
}

$UploadsBackup =
  Join-Path `
    $BackupDir `
    "uploads_$Timestamp.zip"

Compress-Archive `
  -Path "$UploadsDir\*" `
  -DestinationPath $UploadsBackup `
  -Force

Write-Host "Backup voltooid."
Write-Host $DatabaseBackup
Write-Host $UploadsBackup

$RetentionDays = 14
$RetentionLimit = (Get-Date).AddDays(-$RetentionDays)

Get-ChildItem -Path $BackupDir -File |
  Where-Object {
    (
      $_.Name -like 'werkorder_db_*.sql' -or
      $_.Name -like 'uploads_*.zip'
    ) -and
    $_.LastWriteTime -lt $RetentionLimit
  } |
  Remove-Item -Force
    