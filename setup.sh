#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting Sports Prediction Engine setup...${NC}"

# Create necessary directories
echo -e "${YELLOW}Creating project directories...${NC}"
mkdir -p dist
mkdir -p models/traditional
mkdir -p models/deep_learning
mkdir -p models/time_series
mkdir -p models/optimization
mkdir -p cache
mkdir -p src/services/ml/models
mkdir -p src/services/ml/ensemble
mkdir -p src/types

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Create .env file
echo -e "${YELLOW}Creating .env file...${NC}"
cat > .env << EOL
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
EOL

# Create tsconfig.json if it doesn't exist
if [ ! -f tsconfig.json ]; then
    echo -e "${YELLOW}Creating TypeScript configuration...${NC}"
    cat > tsconfig.json << EOL
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
EOL
fi

# Create .eslintrc.json if it doesn't exist
if [ ! -f .eslintrc.json ]; then
    echo -e "${YELLOW}Creating ESLint configuration...${NC}"
    cat > .eslintrc.json << EOL
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
EOL
fi

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo -e "${YELLOW}Creating .gitignore file...${NC}"
    cat > .gitignore << EOL
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
EOL
fi

# Build TypeScript
echo -e "${YELLOW}Building TypeScript...${NC}"
npm run build

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    git add .
    git commit -m "Initial commit"
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update the .env file with your API keys"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Run 'npm test' to run tests"
echo "4. Run 'npm run lint' to check code quality" 