@echo off
set PM2_HOME=C:\Users\Administrator\.pm2
set PATH=C:\php83;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;%PATH%

echo [PM2 Helper] Memulai pemulihan dan reload layanan PM2...

:: 1. Resurrect saved processes if any
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd resurrect

:: 2. Pastikan bappeda-api berjalan di port 8100
cd /d C:\bappeda-halut\backend
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd describe bappeda-api >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [PM2 Helper] Reloading bappeda-api...
    call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd reload bappeda-api --update-env
) else (
    echo [PM2 Helper] Starting bappeda-api...
    call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd start "C:\php83\php.exe artisan serve --host=0.0.0.0 --port=8100" --name bappeda-api
)

:: 3. Pastikan bappeda-fe berjalan di port 3100
cd /d C:\bappeda-halut\frontend
set PORT=3100
set HOSTNAME=0.0.0.0
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd describe bappeda-fe >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [PM2 Helper] Reloading bappeda-fe...
    call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd reload bappeda-fe --update-env
) else (
    echo [PM2 Helper] Starting bappeda-fe...
    if exist server.js (
        call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd start server.js --name bappeda-fe
    ) else if exist .next\standalone\server.js (
        call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd start .next\standalone\server.js --name bappeda-fe
    )
)

:: 4. Simpan status PM2
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd save
echo [PM2 Helper] Layanan PM2 Bappeda Halut Berhasil Diaktifkan!
