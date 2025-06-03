# Main script to set up the entire frontend
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting frontend setup..." -ForegroundColor Cyan

# Run setup scripts in order
try {
    # 1. Run the initial setup script
    Write-Host "`n📦 Running initial setup..." -ForegroundColor Yellow
    & "$PSScriptRoot/setup_frontend.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Initial setup failed" }

    # 2. Create main components
    Write-Host "`n🧩 Creating main components..." -ForegroundColor Yellow
    & "$PSScriptRoot/create_main_components.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Main components creation failed" }

    # 3. Create analytics components
    Write-Host "`n📊 Creating analytics components..." -ForegroundColor Yellow
    & "$PSScriptRoot/create_analytics_components.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Analytics components creation failed" }

    # 4. Create betting components
    Write-Host "`n🎲 Creating betting components..." -ForegroundColor Yellow
    & "$PSScriptRoot/create_betting_components.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Betting components creation failed" }

    # 5. Create pages
    Write-Host "`n📄 Creating pages..." -ForegroundColor Yellow
    & "$PSScriptRoot/create_pages.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Pages creation failed" }

    # 6. Create hooks
    Write-Host "`n🎣 Creating hooks..." -ForegroundColor Yellow
    & "$PSScriptRoot/create_hooks.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Hooks creation failed" }

    # 7. Create services
    Write-Host "`n🔧 Creating services..." -ForegroundColor Yellow
    & "$PSScriptRoot/create_services.ps1"
    if ($LASTEXITCODE -ne 0) { throw "Services creation failed" }

    Write-Host "`n✅ Frontend setup completed successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:"
    Write-Host "1. cd into the project directory"
    Write-Host "2. Run 'npm install' to install dependencies"
    Write-Host "3. Run 'npm run dev' to start the development server"
    Write-Host "4. Open http://localhost:5173 in your browser"
}
catch {
    Write-Host "`n❌ Error: $_" -ForegroundColor Red
    Write-Host "Setup failed. Please check the error message above and try again."
    exit 1
} 