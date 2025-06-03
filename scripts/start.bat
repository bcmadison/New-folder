@echo off
:: Create a log file with timestamp
set "LOGFILE=startup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.log"
set "LOGFILE=%LOGFILE: =0%"

:: Function to log messages
call :log "Starting PrizePicks Betting System..."
call :log "================================"

:: Enable error messages
set "DEBUG=true"

:: Check if Node.js is installed
call :log "Checking Node.js installation..."
node --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :log "Error: Node.js is not installed."
    call :log "Please install Node.js from https://nodejs.org/"
    call :log "Check the log file: %LOGFILE% for details"
    pause
    exit /b 1
)
call :log "Node.js check passed."
for /f "tokens=*" %%i in ('node -v') do call :log "Node.js version: %%i"

:: Check Node.js version
call :log "Checking Node.js version..."
node -e "if (process.version.match(/^v(\d+)/)[1] < 18) { process.exit(1) }" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :log "Error: Node.js version 18 or higher is required."
    for /f "tokens=*" %%i in ('node -v') do call :log "Current version: %%i"
    call :log "Check the log file: %LOGFILE% for details"
    pause
    exit /b 1
)
call :log "Node.js version check passed."

:: Check if npm is installed and get its version
call :log "Checking npm installation..."

:: First check if npm exists in the Node.js directory
if exist "C:\Program Files\nodejs\npm.cmd" (
    call :log "Found npm in Node.js directory"
    for /f "tokens=*" %%i in ('C:\Program Files\nodejs\npm.cmd -v 2^>nul') do (
        call :log "npm version: %%i"
        goto :npm_found
    )
)

:: Then check if npm exists in the user's AppData
if exist "%APPDATA%\npm\npm.cmd" (
    call :log "Found npm in AppData"
    for /f "tokens=*" %%i in ('%APPDATA%\npm\npm.cmd -v 2^>nul') do (
        call :log "npm version: %%i"
        goto :npm_found
    )
)

:: Finally try the PATH
for /f "tokens=*" %%i in ('npm -v 2^>nul') do (
    call :log "Found npm in PATH"
    call :log "npm version: %%i"
    goto :npm_found
)

:: If we get here, npm was not found
call :log "Warning: npm not found in standard locations"
call :log "Checking Node.js installation directory..."
if exist "C:\Program Files\nodejs" (
    dir "C:\Program Files\nodejs\npm*" >> "%LOGFILE%" 2>&1
)
call :log "Please run these commands manually to verify:"
call :log "1. node -v"
call :log "2. where npm"
call :log "3. npm -v"
pause
exit /b 1

:npm_found
call :log "npm check passed."
call :log ""
echo Press any key to continue with the rest of the setup...
pause

:: Create necessary directories if they don't exist
call :log "Setting up directory structure..."
if not exist "logs" (
    call :log "Creating logs directory..."
    mkdir logs
)
if not exist "data" (
    call :log "Creating data directory..."
    mkdir data
)
call :log "Directory setup complete."

:: Check current directory
call :log "Current directory: %CD%"

:: Check if package.json exists
if not exist "package.json" (
    call :log "Error: package.json not found in current directory."
    call :log "Please ensure you are in the correct project directory."
    call :log "Check the log file: %LOGFILE% for details"
    pause
    exit /b 1
)
call :log "Found package.json"

echo Press any key to continue with dependency checks...
pause

:: Check if .env file exists
call :log "Checking .env file..."
if not exist ".env" (
    if exist ".env.example" (
        call :log "Creating .env file from .env.example..."
        copy .env.example .env
        if %ERRORLEVEL% neq 0 (
            call :log "Error: Failed to create .env file"
            pause
            exit /b 1
        )
        call :log "Created .env file successfully."
    ) else (
        call :log "Error: .env.example file not found"
        pause
        exit /b 1
    )
)
call :log "Environment file check passed."

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    call :log "Installing dependencies..."
    call npm install
    if %ERRORLEVEL% neq 0 (
        call :log "Error: Failed to install dependencies"
        pause
        exit /b 1
    )
    call :log "Dependencies installed successfully."
)

:: Run TypeScript type checking
call :log "Running type checking..."
call npm run typecheck
if %ERRORLEVEL% neq 0 (
    call :log "Warning: TypeScript type checking found errors"
    call :log "Do you want to continue anyway? (Y/N)"
    set /p CONTINUE=
    if /i "%CONTINUE%" neq "Y" (
        call :log "Aborting due to TypeScript errors"
        pause
        exit /b 1
    )
    call :log "Continuing despite TypeScript errors..."
)
call :log "Type checking stage complete."

:: Run ESLint
call :log "Running linting..."
call npm run lint
if %ERRORLEVEL% neq 0 (
    call :log "Warning: ESLint found issues"
    call :log "Do you want to continue anyway? (Y/N)"
    set /p CONTINUE=
    if /i "%CONTINUE%" neq "Y" (
        call :log "Aborting due to linting errors"
        pause
        exit /b 1
    )
    call :log "Continuing despite linting errors..."
)
call :log "Linting stage complete."

:: Build the application for production
call :log "Building application for production..."
call npm run build
if %ERRORLEVEL% neq 0 (
    call :log "Error: Production build failed"
    pause
    exit /b 1
)
call :log "Production build completed successfully."

:: Start the application in production mode
call :log "Starting production server..."
call npm run start
if %ERRORLEVEL% neq 0 (
    call :log "Error: Failed to start production server"
    pause
    exit /b 1
)
call :log "Production server started successfully."

call :log "================================"
call :log "PrizePicks Betting System is running in PRODUCTION mode!"
call :log "Press Ctrl+C to stop the application"
call :log "================================"

:: Keep the window open and show final status
echo.
echo Startup completed! The production server is running.
echo You can close this window now.
pause

:log
echo %~1
echo %~1 >> "%LOGFILE%"
goto :eof 