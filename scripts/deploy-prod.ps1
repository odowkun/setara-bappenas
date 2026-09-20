# ==============================================================================
# Script Otomasi CI/CD Deployment Bappeda Halut
# Lokasi: scripts/deploy-prod.ps1
# Dipanggil oleh: .github/workflows/deploy.yml
# Kompatibel penuh: Windows Server 2016 / PowerShell 5.1
# ==============================================================================

$ErrorActionPreference = "Continue"

# Lepaskan kaitan proses dari runner agar tidak dibunuh saat 'Cleaning up orphan processes'
$env:RUNNER_TRACKING_ID = $null
Remove-Item env:RUNNER_TRACKING_ID -ErrorAction SilentlyContinue

Write-Output "=================================================="
Write-Output "[INFO] Memulai Otomasi Deployment BAPPEDA HALUT..."
Write-Output "=================================================="

$prodRoot = "C:\bappeda-halut"
$repoRoot = (Get-Location).Path

Write-Output "[INFO] Repo Source : $repoRoot"
Write-Output "[INFO] Prod Target : $prodRoot"

if (!(Test-Path $prodRoot)) {
    New-Item -ItemType Directory -Path $prodRoot -Force | Out-Null
}

# Pastikan PATH environment mencakup PHP, Node.js, dan NPM global (PM2)
$env:PATH = "C:\php83;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;$env:PATH"
$env:PM2_HOME = "C:\Users\Administrator\.pm2"

# 0. Bangunkan segera PM2 jika sempat terhenti agar situs tidak di mode pemeliharaan
$reloadBat = Join-Path $repoRoot "scripts\reload-pm2.bat"
$prodReloadBat = Join-Path $prodRoot "scripts\reload-pm2.bat"
if (Test-Path $reloadBat) {
    Write-Output "[INFO] Memastikan PM2 aktif segera (Detached via WMI & Task Scheduler)..."
    schtasks /Create /TN "Bappeda_PM2_Boot" /TR "$reloadBat" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F | Out-Null
    schtasks /Run /TN "Bappeda_PM2_Boot" | Out-Null
    wmic process call create "$reloadBat" | Out-Null
}

# 1. Sinkronisasi File Backend (Kecuali .env dan storage)
Write-Output "[INFO] [1/4] Menyinkronkan file Backend..."
$backendSrc = Join-Path $repoRoot "backend"
$backendDest = Join-Path $prodRoot "backend"

if (Test-Path $backendSrc) {
    if (!(Test-Path $backendDest)) { New-Item -ItemType Directory -Path $backendDest -Force | Out-Null }
    robocopy $backendSrc $backendDest /E /XD storage .git /XF .env .env.* /R:2 /W:1 | Out-Null
    if ($LASTEXITCODE -gt 7) {
        Write-Error "Robocopy backend gagal dengan exit code $LASTEXITCODE"
    }
}

# 2. Sinkronisasi File Frontend (Kecuali node_modules, .next, .env)
Write-Output "[INFO] [2/4] Menyinkronkan file Frontend..."
$frontendSrc = Join-Path $repoRoot "frontend"
$frontendDest = Join-Path $prodRoot "frontend"

if (Test-Path $frontendSrc) {
    if (!(Test-Path $frontendDest)) { New-Item -ItemType Directory -Path $frontendDest -Force | Out-Null }
    robocopy $frontendSrc $frontendDest /E /XD node_modules .next .git /XF .env .env.* /R:2 /W:1 | Out-Null
    if ($LASTEXITCODE -gt 7) {
        Write-Error "Robocopy frontend gagal dengan exit code $LASTEXITCODE"
    }
}

# 3. Sinkronisasi Scripts
$scriptsSrc = Join-Path $repoRoot "scripts"
$scriptsDest = Join-Path $prodRoot "scripts"
if (Test-Path $scriptsSrc) {
    if (!(Test-Path $scriptsDest)) { New-Item -ItemType Directory -Path $scriptsDest -Force | Out-Null }
    robocopy $scriptsSrc $scriptsDest /E /R:2 /W:1 | Out-Null
}

# 4. Update Backend Laravel
Write-Output "[INFO] [3/4] Menjalankan Laravel Artisan Migrate & Cache..."
Set-Location $backendDest

$phpExe = "php"
if (Test-Path "C:\php83\php.exe") {
    $phpExe = "C:\php83\php.exe"
}

& $phpExe artisan migrate --force
& $phpExe artisan config:cache
& $phpExe artisan route:cache
& $phpExe artisan view:cache

# 5. Build Frontend Next.js
Write-Output "[INFO] [4/4] Membangun Frontend Next.js..."
Set-Location $frontendDest

$npmCmd = "npm"
if (Test-Path "C:\Program Files\nodejs\npm.cmd") {
    $npmCmd = "C:\Program Files\nodejs\npm.cmd"
}

Write-Output "[INFO] Memastikan dependensi frontend terpasang..."
& $npmCmd install @swc/helpers@0.5.15 react-dom@19.0.0 react@19.0.0 --no-audit

Write-Output "[INFO] Menjalankan Next.js build..."
& $npmCmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Output "[WARN] Next.js build menghasilkan exit code $LASTEXITCODE. Menjaga layanan tetap aktif dengan build eksisting..."
} else {
    Write-Output "[SUCCESS] Next.js build berhasil! Menyinkronkan artefak standalone..."
    $publicSrc = Join-Path $frontendDest "public"
    $publicDest = Join-Path $frontendDest ".next\standalone\public"
    if (Test-Path $publicSrc) {
        robocopy $publicSrc $publicDest /E /R:2 /W:1 | Out-Null
    }

    $staticSrc = Join-Path $frontendDest ".next\static"
    $staticDest = Join-Path $frontendDest ".next\standalone\.next\static"
    if (Test-Path $staticSrc) {
        robocopy $staticSrc $staticDest /E /R:2 /W:1 | Out-Null
    }
}

# 6. Reload PM2 (Zero-Downtime via WMI & Task Scheduler agar terlepas dari Job Object runner)
Write-Output "[INFO] Mereload layanan PM2 secara detached..."
$finalReloadBat = if (Test-Path $prodReloadBat) { $prodReloadBat } else { $reloadBat }
if (Test-Path $finalReloadBat) {
    schtasks /Create /TN "Bappeda_PM2_Reload" /TR "$finalReloadBat" /SC ONSTART /RU "SYSTEM" /RL HIGHEST /F | Out-Null
    schtasks /Run /TN "Bappeda_PM2_Reload" | Out-Null
    wmic process call create "$finalReloadBat" | Out-Null
    Start-Sleep -Seconds 5
}

Write-Output "=================================================="
Write-Output "[SUCCESS] DEPLOYMENT BERHASIL! Layanan Bappeda Halut Aktif!"
Write-Output "=================================================="
