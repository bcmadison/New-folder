# AI Sports Betting Platform - Automated Setup and Verification
Write-Host "=== AI Sports Betting Platform - Automated Setup and Verification ==="
Write-Host ""

# Set up logging
$LOG_DIR = "logs"
if (-not (Test-Path $LOG_DIR)) {
    New-Item -ItemType Directory -Path $LOG_DIR | Out-Null
}
$LOG_FILE = Join-Path $LOG_DIR "setup_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# Function to log messages
function Log-Message {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Add-Content -Path $LOG_FILE
    Write-Host $Message
}

Log-Message "Starting automated setup and verification..."

# Check Python installation
Log-Message "Checking Python installation..."
try {
    $pythonVersion = python --version
    if (-not $?) {
        throw "Python not found"
    }
} catch {
    Log-Message "ERROR: Python is not installed or not in PATH"
    Write-Host "Python is not installed or not in PATH. Please install Python 3.8 or higher."
    exit 1
}
Log-Message "Python is installed"

# Check Node.js installation
Log-Message "Checking Node.js installation..."
try {
    $nodeVersion = node --version
    if (-not $?) {
        throw "Node.js not found"
    }
} catch {
    Log-Message "ERROR: Node.js is not installed or not in PATH"
    Write-Host "Node.js is not installed or not in PATH. Please install Node.js 16 or higher."
    exit 1
}
Log-Message "Node.js is installed"

# Create and activate virtual environment
Log-Message "Setting up Python virtual environment..."
if (-not (Test-Path "venv")) {
    python -m venv venv
    if (-not $?) {
        Log-Message "ERROR: Failed to create virtual environment"
        Write-Host "Failed to create virtual environment"
        exit 1
    }
}
Log-Message "Virtual environment created"

# Activate virtual environment and install dependencies
Log-Message "Installing Python dependencies..."
& .\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
if (-not $?) {
    Log-Message "ERROR: Failed to install Python dependencies"
    Write-Host "Failed to install Python dependencies"
    exit 1
}
Log-Message "Python dependencies installed"

# Install frontend dependencies
Log-Message "Installing frontend dependencies..."
Push-Location frontend
npm install
if (-not $?) {
    Log-Message "ERROR: Failed to install frontend dependencies"
    Write-Host "Failed to install frontend dependencies"
    Pop-Location
    exit 1
}
Log-Message "Frontend dependencies installed"
Pop-Location

# Verify ML system
Log-Message "Verifying ML system..."
python verify_ml.py
if (-not $?) {
    Log-Message "ERROR: ML system verification failed"
    Write-Host "ML system verification failed"
    exit 1
}
Log-Message "ML system verified"

# Start backend server
Log-Message "Starting backend server..."
$backendJob = Start-Process -FilePath ".\venv\Scripts\python" -ArgumentList "backend\server.py" -RedirectStandardOutput "$LOG_DIR\backend_output.log" -RedirectStandardError "$LOG_DIR\backend_output.log" -PassThru
Start-Sleep -Seconds 10
Log-Message "Backend server started"

# Start frontend development server
Log-Message "Starting frontend development server..."
Push-Location frontend
$frontendJob = Start-Process -FilePath "npm" -ArgumentList "run dev" -RedirectStandardOutput "..\$LOG_DIR\frontend_output.log" -RedirectStandardError "..\$LOG_DIR\frontend_output.log" -PassThru
Pop-Location
Start-Sleep -Seconds 10
Log-Message "Frontend server started"

# Check if servers are running
Log-Message "Checking server status..."
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing
    if ($backendResponse.StatusCode -ne 200) {
        throw "Backend server not responding"
    }
} catch {
    Log-Message "ERROR: Backend server is not responding"
    Write-Host "Backend server is not responding. Check $LOG_DIR\backend_output.log for details."
    Stop-Process -Id $backendJob.Id -Force
    Stop-Process -Id $frontendJob.Id -Force
    exit 1
}
Log-Message "Backend server is running"

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    if ($frontendResponse.StatusCode -ne 200) {
        throw "Frontend server not responding"
    }
} catch {
    Log-Message "ERROR: Frontend server is not responding"
    Write-Host "Frontend server is not responding. Check $LOG_DIR\frontend_output.log for details."
    Stop-Process -Id $backendJob.Id -Force
    Stop-Process -Id $frontendJob.Id -Force
    exit 1
}
Log-Message "Frontend server is running"

# Final success message
Write-Host ""
Write-Host "=== Setup Complete ==="
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
Write-Host ""
Write-Host "Logs are available in the $LOG_DIR directory"
Write-Host ""
Log-Message "Setup completed successfully"

# Keep the script running and handle cleanup on exit
try {
    Wait-Process -Id $backendJob.Id, $frontendJob.Id
} finally {
    Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue
} 