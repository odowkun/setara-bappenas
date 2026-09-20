# ==============================================================================
# Script Otomasi CI/CD Deployment Bappeda Halut
# Lokasi: scripts/deploy-prod.ps1
# Dipanggil oleh: .github/workflows/deploy.yml
# Kompatibel penuh: Windows Server 2016 / PowerShell 5.1
# ==============================================================================

$ErrorActionPreference = "Continue"

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

# 1. Sinkronisasi File Backend (Kecuali .env dan storage)
Write-Output "[INFO] [1/4] Menyinkronkan file Backend..."
$backendSrc = Join-Path $repoRoot "backend"
$backendDest = Join-Path $prodRoot "backend"

if (Test-Path $backendSrc) {
    if (!(Test-Path $backendDest)) { New-Item -ItemType Directory -Path $backendDest -Force | Out-Null }
    robocopy $backendSrc $backendDest /E /XD storage .git /XF .env .env.* /R:2 /W:1 | Out-Null
    if ($LASTEXITCODE -gt 7) {
        Write-Error "Robocopy backend gagal dengan exit code $LASTEXITCODE"
        exit 1
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
        exit 1
    }
}

# 3. Sinkronisasi Scripts
$scriptsSrc = Join-Path $repoRoot "scripts"
$scriptsDest = Join-Path $prodRoot "scripts"
if (Test-Path $scriptsSrc) {
    if (!(Test-Path $scriptsDest)) { New-Item -ItemType Directory -Path $scriptsDest -Force | Out-Null }
    robocopy $scriptsSrc $scriptsDest /E /R:2 /W:1 | Out-Null
    if ($LASTEXITCODE -gt 7) {
        Write-Error "Robocopy scripts gagal dengan exit code $LASTEXITCODE"
        exit 1
    }
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

& $npmCmd install --prefer-offline --no-audit
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install gagal dengan kode exit $LASTEXITCODE"
    exit 1
}

& $npmCmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Next.js build gagal dengan kode exit $LASTEXITCODE"
    exit 1
}

# Pastikan public & static tersalin ke standalone
$publicSrc = Join-Path $frontendDest "public"
$publicDest = Join-Path $frontendDest ".next\standalone\public"
if (Test-Path $publicSrc) {
    robocopy $publicSrc $publicDest /E /R:2 /W:1 | Out-Null
    if ($LASTEXITCODE -gt 7) {
        Write-Error "Robocopy public static gagal dengan exit code $LASTEXITCODE"
        exit 1
    }
}

$staticSrc = Join-Path $frontendDest ".next\static"
$staticDest = Join-Path $frontendDest ".next\standalone\.next\static"
if (Test-Path $staticSrc) {
    robocopy $staticSrc $staticDest /E /R:2 /W:1 | Out-Null
    if ($LASTEXITCODE -gt 7) {
        Write-Error "Robocopy static files gagal dengan exit code $LASTEXITCODE"
        exit 1
    }
}

# 6. Reload PM2 (Zero-Downtime)
Write-Output "[INFO] Mereload layanan PM2 (Zero-Downtime)..."
$pm2Cmd = "pm2"
if (Test-Path "C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd") {
    $pm2Cmd = "C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd"
}

Write-Output "[INFO] Reloading bappeda-api..."
& $pm2Cmd reload bappeda-api --update-env
if ($LASTEXITCODE -ne 0) {
    Write-Output "[WARN] Reload bappeda-api gagal, mencoba restart..."
    & $pm2Cmd restart bappeda-api --update-env
}

Write-Output "[INFO] Reloading bappeda-fe..."
& $pm2Cmd reload bappeda-fe --update-env
if ($LASTEXITCODE -ne 0) {
    Write-Output "[WARN] Reload bappeda-fe gagal, mencoba restart..."
    & $pm2Cmd restart bappeda-fe --update-env
}

& $pm2Cmd save

Write-Output "=================================================="
Write-Output "[SUCCESS] DEPLOYMENT BERHASIL! Web Bappeda Halut Terupdate!"
Write-Output "=================================================="
