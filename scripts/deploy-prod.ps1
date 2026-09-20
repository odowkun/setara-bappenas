# ==============================================================================
# Script Otomasi CI/CD Deployment Bappeda Halut
# Lokasi: scripts/deploy-prod.ps1
# Dipanggil oleh: .github/workflows/deploy.yml
# ==============================================================================

$ErrorActionPreference = "Continue"

Write-Output "=================================================="
Write-Output "🚀 Memulai Otomasi Deployment BAPPEDA HALUT..."
Write-Output "=================================================="

$prodRoot = "C:\bappeda-halut"
$repoRoot = (Get-Location).Path

Write-Output "📍 Repo Source : $repoRoot"
Write-Output "📍 Prod Target : $prodRoot"

if (!(Test-Path $prodRoot)) {
    New-Item -ItemType Directory -Path $prodRoot -Force | Out-Null
}

# Pastikan PATH environment mencakup PHP, Node.js, dan NPM global (PM2)
$env:PATH = "C:\php83;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;$env:PATH"
$env:PM2_HOME = "C:\Users\Administrator\.pm2"

# 1. Sinkronisasi File Backend (Kecuali .env dan storage)
Write-Output "📂 [1/4] Menyinkronkan file Backend..."
$backendSrc = Join-Path $repoRoot "backend"
$backendDest = Join-Path $prodRoot "backend"

if (Test-Path $backendSrc) {
    if (!(Test-Path $backendDest)) { New-Item -ItemType Directory -Path $backendDest -Force | Out-Null }
    & cmd.exe /c "robocopy `"$backendSrc`" `"$backendDest`" /E /XD storage .git /XF .env .env.* /R:2 /W:1 & if %ERRORLEVEL% leq 7 exit 0"
}

# 2. Sinkronisasi File Frontend (Kecuali node_modules, .next, .env)
Write-Output "📂 [2/4] Menyinkronkan file Frontend..."
$frontendSrc = Join-Path $repoRoot "frontend"
$frontendDest = Join-Path $prodRoot "frontend"

if (Test-Path $frontendSrc) {
    if (!(Test-Path $frontendDest)) { New-Item -ItemType Directory -Path $frontendDest -Force | Out-Null }
    & cmd.exe /c "robocopy `"$frontendSrc`" `"$frontendDest`" /E /XD node_modules .next .git /XF .env .env.* /R:2 /W:1 & if %ERRORLEVEL% leq 7 exit 0"
}

# 3. Sinkronisasi Scripts
$scriptsSrc = Join-Path $repoRoot "scripts"
$scriptsDest = Join-Path $prodRoot "scripts"
if (Test-Path $scriptsSrc) {
    if (!(Test-Path $scriptsDest)) { New-Item -ItemType Directory -Path $scriptsDest -Force | Out-Null }
    & cmd.exe /c "robocopy `"$scriptsSrc`" `"$scriptsDest`" /E /R:2 /W:1 & if %ERRORLEVEL% leq 7 exit 0"
}

# 4. Update Backend Laravel
Write-Output "🐘 [3/4] Menjalankan Laravel Artisan Migrate & Cache..."
Set-Location $backendDest

if (Test-Path "C:\php83\php.exe") {
    & "C:\php83\php.exe" artisan migrate --force
    & "C:\php83\php.exe" artisan config:cache
    & "C:\php83\php.exe" artisan route:cache
    & "C:\php83\php.exe" artisan view:cache
} else {
    php artisan migrate --force
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
}

# 5. Build Frontend Next.js
Write-Output "⚛️ [4/4] Membangun Frontend Next.js..."
Set-Location $frontendDest

& cmd.exe /c "npm install --prefer-offline --no-audit"
& cmd.exe /c "npm run build"

# Pastikan public & static tersalin ke standalone
$publicSrc = Join-Path $frontendDest "public"
$publicDest = Join-Path $frontendDest ".next\standalone\public"
if (Test-Path $publicSrc) {
    & cmd.exe /c "robocopy `"$publicSrc`" `"$publicDest`" /E /R:2 /W:1 & if %ERRORLEVEL% leq 7 exit 0"
}

$staticSrc = Join-Path $frontendDest ".next\static"
$staticDest = Join-Path $frontendDest ".next\standalone\.next\static"
if (Test-Path $staticSrc) {
    & cmd.exe /c "robocopy `"$staticSrc`" `"$staticDest`" /E /R:2 /W:1 & if %ERRORLEVEL% leq 7 exit 0"
}

# 6. Reload PM2
Write-Output "🔄 Mereload layanan PM2 (Zero-Downtime)..."
& cmd.exe /c "pm2 reload bappeda-api --update-env || pm2 restart bappeda-api"
& cmd.exe /c "pm2 reload bappeda-fe --update-env || pm2 restart bappeda-fe"
& cmd.exe /c "pm2 save"

Write-Output "=================================================="
Write-Output "🎉 DEPLOYMENT BERHASIL! Web Bappeda Halut Terupdate!"
Write-Output "=================================================="
