# Colors for output
$Green = [System.ConsoleColor]::Green
$Yellow = [System.ConsoleColor]::Yellow

Write-Host "Starting Sports Prediction Engine setup..." -ForegroundColor $Green

# Create necessary directories
Write-Host "Creating project directories..." -ForegroundColor $Yellow
New-Item -ItemType Directory -Force -Path @(
    "dist",
    "models/traditional",
    "models/deep_learning",
    "models/time_series",
    "models/optimization",
    "cache",
    "src/services/ml/models",
    "src/services/ml/ensemble",
    "src/types"
) | Out-Null

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor $Yellow
npm install

# Create .env file
Write-Host "Creating .env file..." -ForegroundColor $Yellow
@"
# API Keys
SPORTS_API_KEY=your_sports_api_key_here
ODDS_API_KEY=your_odds_api_key_here

# API Base URLs
SPORTS_API_BASE_URL=https://api.sportsdata.io/v3
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4

# Server Configuration
PORT=3000
NODE_ENV=development

# Model Configuration
MODEL_SAVE_PATH=./models
CACHE_DIR=./cache

# Frontend Configuration
VITE_APP_TITLE="AI Sports Betting Analytics"
VITE_API_URL="http://localhost:3000"
VITE_WEBSOCKET_URL="ws://localhost:3000/ws/live-updates"
VITE_SENTRY_DSN="YOUR_SENTRY_DSN_HERE"

# React Configuration
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_WS_URL=ws://localhost:3000
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Create tsconfig.json if it doesn't exist
if (-not (Test-Path "tsconfig.json")) {
    Write-Host "Creating TypeScript configuration..." -ForegroundColor $Yellow
    @"
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "downlevelIteration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
"@ | Out-File -FilePath "tsconfig.json" -Encoding UTF8
}

# Create .eslintrc.json if it doesn't exist
if (-not (Test-Path ".eslintrc.json")) {
    Write-Host "Creating ESLint configuration..." -ForegroundColor $Yellow
    @"
{
  "env": {
    "browser": true,
    "es2021": true,
    "jest": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off"
  }
}
"@ | Out-File -FilePath ".eslintrc.json" -Encoding UTF8
}

# Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore file..." -ForegroundColor $Yellow
    @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Project specific
models/
cache/
*.log

# TypeScript
*.tsbuildinfo
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# Build TypeScript
Write-Host "Building TypeScript..." -ForegroundColor $Yellow
npm run build

# Initialize git if not already initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..." -ForegroundColor $Yellow
    git init
    git add .
    git commit -m "Initial commit"
}

Write-Host "Setup complete!" -ForegroundColor $Green
Write-Host "Next steps:" -ForegroundColor $Yellow
Write-Host "1. Update the .env file with your API keys"
Write-Host "2. Run 'npm run dev' to start the development server"
Write-Host "3. Run 'npm test' to run tests"
Write-Host "4. Run 'npm run lint' to check code quality" 