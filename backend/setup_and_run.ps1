Write-Host "Setting up Python virtual environment and installing dependencies..."

# Check if Python is installed
try {
    $pythonVersion = python --version
    Write-Host "Found Python: $pythonVersion"
} catch {
    Write-Host "Python is not installed or not in PATH. Please install Python 3.8 or higher."
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path ".venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}

# Activate virtual environment and install dependencies
Write-Host "Activating virtual environment and installing dependencies..."
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

# Set environment variables
$env:PORT = "8000"
$env:API_BASE_URL = "http://localhost:5173"

# Start the server
Write-Host "Starting backend server..."
python server.py 