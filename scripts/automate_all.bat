@echo off
echo ===== AI Sports Betting Analytics Platform - Complete Automation =====
echo.

:: Step 1: Clean up
echo [STEP 1] Cleaning up...
call cleanup.bat

:: Step 2: Setup environment
echo [STEP 2] Setting up environment...
call setup_environment.bat
if errorlevel 1 (
    echo [ERROR] Environment setup failed
    pause
    exit /b 1
)

:: Step 3: Start application
echo [STEP 3] Starting application...
call run.bat

:: Step 4: Wait for servers to initialize
echo [STEP 4] Waiting for servers to initialize...
timeout /t 10 /nobreak >nul

:: Step 5: Run all verifications
echo [STEP 5] Running verifications...
call verify_all.bat

:: Step 6: Generate report
echo [STEP 6] Generating report...
python generate_report.py

echo.
echo ===== Automation Complete =====
echo.
echo Please check the following files for results:
echo - verification_report.html (Complete report)
echo - ui_verification_results.json
echo - backend_verification_results.json
echo - real_data_verification_results.json
echo - design_verification_results.json
echo.
echo The application is running at:
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
echo.
echo Press any key to exit...
pause >nul 