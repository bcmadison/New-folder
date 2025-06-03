# PowerShell script to download and install Python
$ErrorActionPreference = "Stop"

Write-Host "=== Python Installation Script ===" -ForegroundColor Green

# Create temp directory
$tempDir = ".\temp"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# Download Python installer
$pythonUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
$installerPath = Join-Path $tempDir "python-installer.exe"

Write-Host "Downloading Python installer..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $pythonUrl -OutFile $installerPath

# Install Python
Write-Host "Installing Python..." -ForegroundColor Yellow
$installArgs = @(
    "/quiet",  # Quiet installation
    "InstallAllUsers=1",  # Install for all users
    "PrependPath=1",  # Add Python to PATH
    "TargetDir=C:\Python311"  # Install to a simple path
)

Start-Process -FilePath $installerPath -ArgumentList $installArgs -Wait

# Clean up
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "`nPython installation complete!" -ForegroundColor Green
Write-Host "Please restart PowerShell and run the run_all.ps1 script again." 