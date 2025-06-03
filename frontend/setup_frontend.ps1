# Master script to set up the frontend
$ErrorActionPreference = "Stop"

# Function to create a directory
function Create-Directory {
    param(
        [string]$Path
    )
    
    if (-not (Test-Path -Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
        Write-Host "Created directory: $Path" -ForegroundColor Green
    }
}

# Function to write content to a file
function Write-FileContent {
    param(
        [string]$Path,
        [string]$Content
    )
    
    try {
        [System.IO.File]::WriteAllText($Path, $Content, [System.Text.Encoding]::UTF8)
        Write-Host "Created file: $Path" -ForegroundColor Green
    }
    catch {
        Write-Host "Error creating file $Path : $_" -ForegroundColor Red
    }
}

# Create required directories
$dirs = @(
    "src",
    "src/components",
    "src/components/analytics",
    "src/components/betting",
    "src/components/common",
    "src/components/controls",
    "src/components/lineup",
    "src/components/predictions",
    "src/hooks",
    "src/pages",
    "src/routes",
    "src/services"
)

Write-Host "Creating directories..." -ForegroundColor Cyan
foreach ($dir in $dirs) {
    Create-Directory -Path $dir
}

Write-Host "Setting up project..." -ForegroundColor Cyan

# Initialize package.json
$packageJson = @{
    name = "sports-analytics-platform"
    version = "0.1.0"
    private = $true
    type = "module"
    scripts = @{
        dev = "vite"
        build = "tsc && vite build"
        preview = "vite preview"
    }
}
Write-FileContent -Path "package.json" -Content ($packageJson | ConvertTo-Json -Depth 10)

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow

# Install each production dependency separately
Write-Host "Installing production dependencies..." -ForegroundColor Yellow
& npm install react
& npm install react-dom
& npm install react-router-dom
& npm install @tanstack/react-query
& npm install axios
& npm install chart.js
& npm install zustand

# Install each development dependency separately
Write-Host "Installing development dependencies..." -ForegroundColor Yellow
& npm install --save-dev typescript
& npm install --save-dev @types/react
& npm install --save-dev @types/react-dom
& npm install --save-dev @types/node
& npm install --save-dev vite
& npm install --save-dev @vitejs/plugin-react
& npm install --save-dev tailwindcss
& npm install --save-dev postcss
& npm install --save-dev autoprefixer
& npm install --save-dev @typescript-eslint/eslint-plugin
& npm install --save-dev @typescript-eslint/parser
& npm install --save-dev eslint
& npm install --save-dev eslint-plugin-react-hooks
& npm install --save-dev eslint-plugin-react-refresh

# Create configuration files
Write-FileContent -Path "vite.config.ts" -Content @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
'@

Write-FileContent -Path "tsconfig.json" -Content @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
'@

Write-FileContent -Path "tsconfig.node.json" -Content @'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
'@

Write-FileContent -Path "tailwind.config.js" -Content @'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
'@

Write-FileContent -Path "postcss.config.js" -Content @'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
'@

Write-FileContent -Path "index.html" -Content @'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sports Analytics Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
'@

Write-FileContent -Path "src/index.css" -Content @'
@tailwind base;
@tailwind components;
@tailwind utilities;
'@

Write-Host "✨ Frontend setup complete!" -ForegroundColor Green
Write-Host @"

Next steps:
1. Run the component creation scripts:
   ./create_main_components.ps1
   ./create_analytics_components.ps1
   ./create_betting_components.ps1
   ./create_pages.ps1
   ./create_hooks.ps1
   ./create_services.ps1
   ./create_app.ps1

2. Start the development server:
   npm run dev

3. Open http://localhost:5173 in your browser

4. The frontend will connect to the FastAPI backend at http://localhost:8000

Happy coding! 🎉
"@ -ForegroundColor Cyan 