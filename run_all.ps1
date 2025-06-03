# PowerShell script to automate setup and running of backend and frontend

Write-Host "=== AI Sports Betting Platform Setup ==="

# 1. Set Python path explicitly
$pythonPath = "C:\Python311\python.exe"
if (!(Test-Path $pythonPath)) {
    Write-Error "Python not found at $pythonPath. Please ensure Python is installed correctly."
    exit 1
}

Write-Host "Using Python at: $pythonPath"

# 2. Remove broken venv if it exists
if (Test-Path "backend/.venv") {
    Write-Host "Removing existing virtual environment..."
    Remove-Item -Recurse -Force "backend/.venv"
}

# 3. Create new venv
Write-Host "Creating Python virtual environment..."
& $pythonPath -m venv backend/.venv

# 4. Activate venv and install backend dependencies
Write-Host "Installing backend dependencies..."
$activateScript = "backend/.venv/Scripts/Activate.ps1"
if (Test-Path $activateScript) {
    . $activateScript
    & $pythonPath -m pip install --upgrade pip
    & $pythonPath -m pip install -r backend/requirements.txt
} else {
    Write-Error "Failed to activate virtual environment"
    exit 1
}

# 5. Frontend: Install dependencies
Write-Host "Installing frontend dependencies..."
cd frontend
if (Test-Path "package-lock.json") {
    npm ci
} else {
    npm install
}
cd ..

# 6. Start backend server in new window
Write-Host "Starting backend server..."
$backendCmd = "cd '$pwd\backend'; .\.venv\Scripts\Activate.ps1; `$env:PYTHONPATH='.'; python server.py"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd

# 7. Start frontend server in new window
Write-Host "Starting frontend server..."
$frontendCmd = "cd '$pwd\frontend'; npm run dev"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $frontendCmd

Write-Host "`nApplication started!"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend API: http://localhost:8000"
Write-Host "API Docs: http://localhost:8000/docs" 