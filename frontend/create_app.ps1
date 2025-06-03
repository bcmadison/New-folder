# Script to create main application files
Write-Host "📝 Creating main application files..." -ForegroundColor Cyan

# Function to create a file with content
function Create-File {
    param (
        [string]$path,
        [string]$content
    )
    
    $directory = Split-Path -Path $path -Parent
    if (-not (Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
    
    Set-Content -Path $path -Value $content -Force
    Write-Host "📄 Created: $path" -ForegroundColor Green
}

# Create main application files
$appFiles = @{
    "src/App.tsx" = @"
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppShell } from '@/routes/AppShell';
import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Consider data fresh for 30 seconds
      retry: 3, // Retry failed requests 3 times
    },
  },
});

function App() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Apply theme to document
    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
"@

    "src/main.tsx" = @"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize WebSocket service
import { webSocketService } from '@/services/websocket';
webSocketService.connect();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@

    "src/index.css" = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary-50: 239 246 255;
    --color-primary-100: 219 234 254;
    --color-primary-200: 191 219 254;
    --color-primary-300: 147 197 253;
    --color-primary-400: 96 165 250;
    --color-primary-500: 59 130 246;
    --color-primary-600: 37 99 235;
    --color-primary-700: 29 78 216;
    --color-primary-800: 30 64 175;
    --color-primary-900: 30 58 138;
    --color-primary-950: 23 37 84;

    --color-success-50: 240 253 244;
    --color-success-100: 220 252 231;
    --color-success-200: 187 247 208;
    --color-success-300: 134 239 172;
    --color-success-400: 74 222 128;
    --color-success-500: 34 197 94;
    --color-success-600: 22 163 74;
    --color-success-700: 21 128 61;
    --color-success-800: 22 101 52;
    --color-success-900: 20 83 45;
    --color-success-950: 5 46 22;
  }

  .dark {
    --color-primary-50: 23 37 84;
    --color-primary-100: 30 58 138;
    --color-primary-200: 30 64 175;
    --color-primary-300: 29 78 216;
    --color-primary-400: 37 99 235;
    --color-primary-500: 59 130 246;
    --color-primary-600: 96 165 250;
    --color-primary-700: 147 197 253;
    --color-primary-800: 191 219 254;
    --color-primary-900: 219 234 254;
    --color-primary-950: 239 246 255;

    --color-success-50: 5 46 22;
    --color-success-100: 20 83 45;
    --color-success-200: 22 101 52;
    --color-success-300: 21 128 61;
    --color-success-400: 22 163 74;
    --color-success-500: 34 197 94;
    --color-success-600: 74 222 128;
    --color-success-700: 134 239 172;
    --color-success-800: 187 247 208;
    --color-success-900: 220 252 231;
    --color-success-950: 240 253 244;
  }
}

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased dark:bg-gray-900 dark:text-gray-100;
  }

  ::selection {
    @apply bg-primary-500 text-white;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold transition-colors;
  }

  .btn-primary {
    @apply bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50;
  }

  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600;
  }

  .input {
    @apply rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-primary-400 dark:focus:ring-primary-400/20;
  }

  .select {
    @apply rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:focus:border-primary-400 dark:focus:ring-primary-400/20;
  }

  .card {
    @apply rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800;
  }
}
"@

    "src/vite-env.d.ts" = @"
/// <reference types="vite/client" />
"@

    "index.html" = @"
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sports Analytics Platform</title>
    <meta name="description" content="Advanced sports betting analytics platform with AI-powered predictions" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"@

    "vite.config.ts" = @"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
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
});
"@

    "tailwind.config.js" = @"
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        success: {
          50: 'rgb(var(--color-success-50) / <alpha-value>)',
          100: 'rgb(var(--color-success-100) / <alpha-value>)',
          200: 'rgb(var(--color-success-200) / <alpha-value>)',
          300: 'rgb(var(--color-success-300) / <alpha-value>)',
          400: 'rgb(var(--color-success-400) / <alpha-value>)',
          500: 'rgb(var(--color-success-500) / <alpha-value>)',
          600: 'rgb(var(--color-success-600) / <alpha-value>)',
          700: 'rgb(var(--color-success-700) / <alpha-value>)',
          800: 'rgb(var(--color-success-800) / <alpha-value>)',
          900: 'rgb(var(--color-success-900) / <alpha-value>)',
          950: 'rgb(var(--color-success-950) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
"@

    "tsconfig.json" = @"
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path aliases */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
"@

    "tsconfig.node.json" = @"
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
"@

    "package.json" = @"
{
  "name": "sports-analytics-platform",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "chart.js": "^4.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.18.0",
    "ws": "^8.14.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.8.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/ws": "^8.5.0",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "@vitejs/plugin-react": "^4.1.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.53.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.2.0",
    "vite": "^4.5.0"
  }
}
"@

    "postcss.config.js" = @"
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
"@

    ".eslintrc.cjs" = @"
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
"@

    "README.md" = @"
# Sports Analytics Platform

Advanced sports betting analytics platform with AI-powered predictions.

## Features

- Real-time predictions and odds tracking
- Advanced analytics with SHAP value visualization
- Social sentiment analysis integration
- Kelly Criterion bet sizing
- Multi-sport support (NBA, WNBA, MLB, NHL, Soccer)
- Dark/light theme support
- Responsive design

## Tech Stack

- React + TypeScript
- Vite
- TailwindCSS
- React Query
- Chart.js
- WebSocket for real-time updates
- Zustand for state management

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Build for production:
   \`\`\`bash
   npm run build
   \`\`\`

## Development

- \`src/components/\`: React components
- \`src/hooks/\`: Custom React hooks
- \`src/services/\`: API and WebSocket services
- \`src/pages/\`: Page components
- \`src/routes/\`: Routing components

## API Integration

The frontend expects a FastAPI backend running on \`localhost:8000\` with the following endpoints:

- \`/api/v1/players\`: Player data
- \`/api/v1/predictions\`: Model predictions
- \`/api/v1/analytics\`: Analytics data
- \`/api/v1/lineup\`: Lineup management
- \`/ws\`: WebSocket endpoint for real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
"@
}

# Create each application file
foreach ($file in $appFiles.GetEnumerator()) {
    Create-File -path $file.Key -content $file.Value
}

Write-Host "✅ All application files created successfully!" -ForegroundColor Green 