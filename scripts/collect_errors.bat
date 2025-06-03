@echo off
echo ============================================
echo Collecting Error Logs
echo ============================================
echo.

REM Create error report directory
set REPORT_DIR=error_reports_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set REPORT_DIR=%REPORT_DIR: =0%
mkdir %REPORT_DIR%

REM Copy all log files
echo Collecting backend logs...
if exist logs\*.log copy logs\*.log %REPORT_DIR%\
if exist logs\*.json copy logs\*.json %REPORT_DIR%\

echo Collecting frontend logs...
if exist frontend\*.log copy frontend\*.log %REPORT_DIR%\

REM Create system info
echo Creating system info...
(
echo System Information Report
echo ========================
echo.
echo Date: %date% %time%
echo.
echo Python Version:
python --version
echo.
echo Node Version:
node --version
echo.
echo NPM Version:
npm --version
echo.
echo Current Directory:
cd
echo.
echo Directory Contents:
dir /s /b
) > %REPORT_DIR%\system_info.txt

REM Create summary
echo Creating summary...
(
echo Error Report Summary
echo ===================
echo.
echo This folder contains:
echo - All backend Python logs
echo - All frontend JavaScript logs  
echo - API call logs
echo - System information
echo.
echo To share with support:
echo 1. Zip this entire folder
echo 2. Upload to file sharing service
echo 3. Share the link
echo.
echo Latest errors are at the bottom of each log file.
) > %REPORT_DIR%\README.txt

echo ============================================
echo Error logs collected in: %REPORT_DIR%
echo ============================================
echo.
echo You can now zip and share the %REPORT_DIR% folder
echo.
pause
