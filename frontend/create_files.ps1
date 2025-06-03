# Script to create all necessary files
Write-Host "📝 Creating project files..." -ForegroundColor Cyan

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

# Create configuration files
$configFiles = @{
    "tsconfig.json" = @"
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

    "vite.config.ts" = @"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
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
"@

    "tailwind.config.js" = @"
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
"@

    "index.html" = @"
<!DOCTYPE html>
<html lang='en'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width, initial-scale=1.0' />
    <meta name='description' content='AI-powered sports betting analytics platform' />
    <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
    <title>Sports Betting Analytics | AI-Powered Predictions</title>
    <link rel='stylesheet' href='https://rsms.me/inter/inter.css' />
  </head>
  <body>
    <div id='root'></div>
    <script type='module' src='/src/index.tsx'></script>
  </body>
</html>
"@

    "src/index.css" = @"
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    color-scheme: light dark;
  }

  body {
    @apply antialiased;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
}

@layer utilities {
  .scrollbar-hidden {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .scrollbar-hidden::-webkit-scrollbar {
    display: none;
  }
}
"@
}

# Create each configuration file
foreach ($file in $configFiles.GetEnumerator()) {
    Create-File -path $file.Key -content $file.Value
}

# Create source files
$sourceFiles = @{
    "src/index.tsx" = @"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@

    "src/App.tsx" = @"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SmartLineupBuilder } from '@/components/lineup/SmartLineupBuilder';
import { SmartControlsBar } from '@/components/controls/SmartControlsBar';
import { PayoutPreview } from '@/components/lineup/PayoutPreview';
import { useState } from 'react';
import { Player } from '@/services/api';
import { ErrorBoundary } from 'react-error-boundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
    },
  },
});

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className='flex h-screen items-center justify-center bg-red-50 p-4 dark:bg-red-900/20'>
      <div className='text-center'>
        <h2 className='mb-2 text-lg font-semibold text-red-600 dark:text-red-400'>
          Something went wrong
        </h2>
        <pre className='text-sm text-red-500 dark:text-red-300'>{error.message}</pre>
        <button
          onClick={() => window.location.reload()}
          className='mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700'
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  const handleLineupSubmit = (players: Player[]) => {
    setSelectedPlayers(players);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className='flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900'>
          <SmartControlsBar className='sticky top-0 z-10 shadow-sm' />

          <main className='container mx-auto flex flex-1 gap-6 p-6'>
            <div className='flex-1'>
              <SmartLineupBuilder
                onLineupSubmit={handleLineupSubmit}
                className='h-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800'
              />
            </div>

            <div className='w-80'>
              <PayoutPreview
                selectedPlayers={selectedPlayers}
                entryFee={20}
                className='sticky top-24'
              />
            </div>
          </main>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
"@
}

# Create each source file
foreach ($file in $sourceFiles.GetEnumerator()) {
    Create-File -path $file.Key -content $file.Value
}

Write-Host "✅ All files created successfully!" -ForegroundColor Green 