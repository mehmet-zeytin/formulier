$ErrorActionPreference = "Stop"

$ProjectRoot =
  "C:\Users\Eigenaar\Desktop\Bedrijf Project\werkorder-formulier"

$BackupDir =
  Join-Path $ProjectRoot "backups"

$TempRestoreDir =
  Join-Path $ProjectRoot "temp_restore"

$SelectedRestoreDir =
  Join-Path $ProjectRoot "restore_selected_photo"

$ZipFiles =
  Get-ChildItem `
    -Path $BackupDir `
    -Filter "uploads_*.zip" `
    -File |
  Sort-Object `
    LastWriteTime `
    -Descending

if (
  $ZipFiles.Count -eq 0
) {
  Write-Host "Geen foto-back-ups gevonden."
  exit 1
}

Write-Host ""
Write-Host "Beschikbare foto-back-ups:"
Write-Host ""

for (
  $i = 0;
  $i -lt $ZipFiles.Count;
  $i++
) {
  Write-Host (
    "[{0}] {1}" -f
      ($i + 1),
      $ZipFiles[$i].Name
  )
}

Write-Host ""

$BackupSelection =
  Read-Host "Kies een back-upnummer"

$BackupSelectionNumber =
  0

if (
  -not [int]::TryParse(
    $BackupSelection,
    [ref]$BackupSelectionNumber
  ) -or
  $BackupSelectionNumber -lt 1 -or
  $BackupSelectionNumber -gt
    $ZipFiles.Count
) {
  Write-Host "Ongeldige keuze."
  exit 1
}

$SelectedZip =
  $ZipFiles[
    $BackupSelectionNumber - 1
  ]

if (
  Test-Path $TempRestoreDir
) {
  Remove-Item `
    $TempRestoreDir `
    -Recurse `
    -Force
}

New-Item `
  -ItemType Directory `
  -Path $TempRestoreDir `
  -Force |
Out-Null

Expand-Archive `
  -Path $SelectedZip.FullName `
  -DestinationPath $TempRestoreDir `
  -Force

$Photos =
  Get-ChildItem `
    -Path $TempRestoreDir `
    -File |
  Where-Object {
    $_.Extension -match
      '^\.(png|jpg|jpeg|webp)$'
  } |
  Sort-Object Name

if (
  $Photos.Count -eq 0
) {
  Write-Host "Geen foto's gevonden in deze back-up."
  exit 1
}

Write-Host ""
Write-Host "Foto's in deze back-up:"
Write-Host ""

for (
  $i = 0;
  $i -lt $Photos.Count;
  $i++
) {
  Write-Host (
    "[{0}] {1}" -f
      ($i + 1),
      $Photos[$i].Name
  )
}

Write-Host ""
Write-Host "De map wordt geopend zodat u de foto's kunt bekijken."
Write-Host ""

Start-Process `
  explorer.exe `
  $TempRestoreDir

$PhotoSelection =
  Read-Host "Kies het nummer van de foto die u wilt herstellen"

$PhotoSelectionNumber =
  0

if (
  -not [int]::TryParse(
    $PhotoSelection,
    [ref]$PhotoSelectionNumber
  ) -or
  $PhotoSelectionNumber -lt 1 -or
  $PhotoSelectionNumber -gt
    $Photos.Count
) {
  Write-Host "Ongeldige keuze."
  exit 1
}

$SelectedPhoto =
  $Photos[
    $PhotoSelectionNumber - 1
  ]

if (
  Test-Path $SelectedRestoreDir
) {
  Remove-Item `
    $SelectedRestoreDir `
    -Recurse `
    -Force
}

New-Item `
  -ItemType Directory `
  -Path $SelectedRestoreDir `
  -Force |
Out-Null

$Destination =
  Join-Path `
    $SelectedRestoreDir `
    $SelectedPhoto.Name

Copy-Item `
  -Path $SelectedPhoto.FullName `
  -Destination $Destination `
  -Force


Write-Host ""
Write-Host "Foto klaargezet voor herstel:"
Write-Host $SelectedPhoto.Name
Write-Host ""
Write-Host "De foto is NIET automatisch teruggezet in uploads."
Write-Host "Voeg deze foto opnieuw toe via het juiste werkorderformulier."
Write-Host ""

Start-Process `
  explorer.exe `
  $SelectedRestoreDir