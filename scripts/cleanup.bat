@echo off
echo ===== Cleaning up Development Environment =====
echo.

:: Stop running processes
echo [1/5] Stopping running processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

:: Remove Python virtual environment
echo [2/5] Removing Python virtual environment...
if exist "backend\.venv" (
    rmdir /s /q "backend\.venv"
)

:: Remove node_modules
echo [3/5] Removing node_modules...
if exist "frontend\node_modules" (
    rmdir /s /q "frontend\node_modules"
)

:: Remove build artifacts
echo [4/5] Removing build artifacts...
if exist "frontend\dist" (
    rmdir /s /q "frontend\dist"
)
if exist "frontend\.cache" (
    rmdir /s /q "frontend\.cache"
)
if exist "backend\__pycache__" (
    rmdir /s /q "backend\__pycache__"
)

:: Remove log files
echo [5/5] Removing log files...
if exist "backend\logs" (
    rmdir /s /q "backend\logs"
)

echo.
echo ===== Cleanup Complete =====
echo.
echo Press any key to continue...
pause >nul 