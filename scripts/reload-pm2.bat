@echo off
set PM2_HOME=C:\Users\Administrator\.pm2
set PATH=C:\php83;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;%PATH%

echo ==================================================
echo [PM2 Helper] Memulai pemulihan dan reload layanan PM2...
echo ==================================================

:: 1. Resurrect saved processes if any
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd resurrect

:: 2. Pastikan bappeda-api berjalan di port 8100
cd /d C:\bappeda-halut\backend
echo [PM2 Helper] Menghidupkan bappeda-api (Port 8100)...
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd restart bappeda-api --update-env
if %ERRORLEVEL% neq 0 (
    echo [PM2 Helper] Memulai baru bappeda-api...
    call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd start "C:\php83\php.exe artisan serve --host=0.0.0.0 --port=8100" --name bappeda-api
)

:: 3. Pastikan bappeda-fe berjalan di port 3100
cd /d C:\bappeda-halut\frontend
set PORT=3100
set HOSTNAME=0.0.0.0
echo [PM2 Helper] Menghidupkan bappeda-fe (Port 3100)...
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd restart bappeda-fe --update-env
if %ERRORLEVEL% neq 0 (
    echo [PM2 Helper] Memulai baru bappeda-fe...
    if exist server.js (
        call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd start server.js --name bappeda-fe
    ) else if exist .next\standalone\server.js (
        call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd start .next\standalone\server.js --name bappeda-fe
    )
)

:: 4. Simpan status dan tampilkan daftar proses
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd save
echo ==================================================
echo [PM2 Helper] Status Layanan PM2 Saat Ini:
echo ==================================================
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd list
echo ==================================================
