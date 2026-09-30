@echo off
REM ==============================================================================
REM Install & Start GitHub Actions Runner as Native Windows Service (24/7 Auto-Start)
REM ==============================================================================
echo [INFO] Memasang GitHub Actions Runner sebagai Windows Service...
cd /d C:\actions-runner
if not exist "svc.cmd" (
    echo [ERROR] Folder C:\actions-runner atau svc.cmd tidak ditemukan!
    pause
    exit /b 1
)

echo [INFO] Menjalankan svc.cmd install...
call .\svc.cmd install
echo [INFO] Menjalankan svc.cmd start...
call .\svc.cmd start
call .\svc.cmd status
echo.
echo ==============================================================================
echo [SUCCESS] Runner terdaftar sebagai Windows Service (Auto-Start saat Server Boot)!
echo ==============================================================================
pause
