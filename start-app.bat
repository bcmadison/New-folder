@echo off
setlocal

REM === AI Sports Analytics Platform Starter ===
echo [INFO] Starting AI Sports Analytics Platform...

REM Check for node_modules
if not exist node_modules (
  echo [INFO] Installing dependencies...
  npm install || goto :error
)

REM Build if dist does not exist
if not exist dist (
  echo [INFO] Building production bundle...
  npm run build || goto :error
)

REM Start the app (Vite preview or production server)
echo [INFO] Launching app...
npm run preview || goto :error

echo [SUCCESS] App started! Open http://localhost:4173 or your configured port.
goto :eof

:error
echo [ERROR] Something went wrong. Please check the logs above.
pause
endlocal 