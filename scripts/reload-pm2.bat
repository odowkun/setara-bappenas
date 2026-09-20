@echo off
set PM2_HOME=C:\Users\Administrator\.pm2
set PATH=C:\php83;C:\Program Files\nodejs;C:\Users\Administrator\AppData\Roaming\npm;%PATH%

echo [PM2 Helper] Memulihkan dan mereload layanan PM2...
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd resurrect
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd reload all --update-env
if %ERRORLEVEL% neq 0 (
    call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd restart all --update-env
)
call C:\Users\Administrator\AppData\Roaming\npm\pm2.cmd save
echo [PM2 Helper] Selesai.
