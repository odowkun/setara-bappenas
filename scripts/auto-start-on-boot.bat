@echo off
setlocal
echo ==================================================
echo [%date% %time%] [Bappeda AutoStart] Prosedur pemulihan pasca boot/pemadaman dimulai...
echo ==================================================

:: Berikan jeda 15 detik agar OS Windows, networking, dan driver siap sempurna
timeout /t 15 /nobreak >nul 2>&1

:: 1. Pastikan Service Database MariaDB/MySQL Bappeda Aktif
echo [1/3] Memeriksa status MySQL_Bappeda...
net start MySQL_Bappeda >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] MySQL_Bappeda aktif.
) else (
    echo [INFO] MySQL_Bappeda sudah berjalan atau sedang disiapkan.
)

:: 2. Pastikan Service Cloudflare Tunnel Aktif
echo [2/3] Memeriksa status cloudflared...
net start cloudflared >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] cloudflared aktif.
) else (
    echo [INFO] cloudflared sudah berjalan atau sedang disiapkan.
)

:: 3. Pastikan GitHub Actions Runner Aktif (CI/CD)
echo [3/4] Memeriksa status GitHub Actions Runner...
if exist "C:\actions-runner\svc.cmd" (
    cd /d C:\actions-runner
    call .\svc.cmd start >nul 2>&1
) else (
    schtasks /Run /TN "GitHub_Actions_Runner" >nul 2>&1
)

:: 4. Jalankan Reload PM2 (Next.js Frontend & Laravel Backend API)
echo [4/4] Menjalankan layanan PM2...
if exist "C:\bappeda-halut\scripts\reload-pm2.bat" (
    call "C:\bappeda-halut\scripts\reload-pm2.bat"
) else (
    call "%~dp0reload-pm2.bat"
)

echo ==================================================
echo [%date% %time%] [Bappeda AutoStart] Seluruh layanan Bappeda Halut telah dipulihkan!
echo ==================================================
