import os
import shutil
from pathlib import Path
import json

def create_frontend_structure():
    """Create the optimized frontend directory structure."""
    directories = [
        'src/components',
        'src/hooks',
        'src/utils',
        'src/services',
        'src/styles',
        'src/types',
        'src/pages',
        'src/context',
        'public',
        'tests'
    ]
    
    for dir_name in directories:
        os.makedirs(f'frontend/{dir_name}', exist_ok=True)

def create_base_files():
    """Create base frontend files."""
    # Create tsconfig.json
    tsconfig = {
        "compilerOptions": {
            "target": "ES2020",
            "useDefineForClassFields": True,
            "lib": ["ES2020", "DOM", "DOM.Iterable"],
            "module": "ESNext",
            "skipLibCheck": True,
            "moduleResolution": "bundler",
            "allowImportingTsExtensions": True,
            "resolveJsonModule": True,
            "isolatedModules": True,
            "noEmit": True,
            "jsx": "react-jsx",
            "strict": True,
            "noUnusedLocals": True,
            "noUnusedParameters": True,
            "noFallthroughCasesInSwitch": True,
            "baseUrl": ".",
            "paths": {
                "@/*": ["src/*"]
            }
        },
        "include": ["src"],
        "references": [{ "path": "./tsconfig.node.json" }]
    }
    
    with open('frontend/tsconfig.json', 'w') as f:
        json.dump(tsconfig, f, indent=2)
    
    # Create vite.config.ts
    vite_config = """import { defineConfig } from 'vite'
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
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
"""
    
    with open('frontend/vite.config.ts', 'w') as f:
        f.write(vite_config)
    
    # Create package.json
    package_json = {
        "name": "sports-betting-frontend",
        "private": True,
        "version": "0.1.0",
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "tsc && vite build",
            "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
            "preview": "vite preview",
            "test": "jest"
        },
        "dependencies": {
            "@emotion/react": "^11.11.0",
            "@emotion/styled": "^11.11.0",
            "@mui/material": "^5.13.0",
            "@mui/icons-material": "^5.11.16",
            "axios": "^1.4.0",
            "chart.js": "^4.3.0",
            "react": "^18.2.0",
            "react-chartjs-2": "^5.2.0",
            "react-dom": "^18.2.0",
            "react-router-dom": "^6.11.0",
            "zustand": "^4.3.0"
        },
        "devDependencies": {
            "@types/react": "^18.2.0",
            "@types/react-dom": "^18.2.0",
            "@typescript-eslint/eslint-plugin": "^5.59.0",
            "@typescript-eslint/parser": "^5.59.0",
            "@vitejs/plugin-react": "^4.0.0",
            "autoprefixer": "^10.4.14",
            "eslint": "^8.39.0",
            "eslint-plugin-react-hooks": "^4.6.0",
            "eslint-plugin-react-refresh": "^0.4.0",
            "postcss": "^8.4.23",
            "tailwindcss": "^3.3.2",
            "typescript": "^5.0.4",
            "vite": "^4.3.0"
        }
    }
    
    with open('frontend/package.json', 'w') as f:
        json.dump(package_json, f, indent=2)

def create_component_files():
    """Create base component files."""
    # Create App.tsx
    app_content = """import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { theme } from './styles/theme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Predictions from './pages/Predictions'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App
"""
    
    with open('frontend/src/App.tsx', 'w') as f:
        f.write(app_content)
    
    # Create Layout component
    layout_content = """import { ReactNode } from 'react'
import { Box, Container } from '@mui/material'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          pt: 8,
          px: 3,
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </Box>
  )
}

export default Layout
"""
    
    with open('frontend/src/components/Layout.tsx', 'w') as f:
        f.write(layout_content)

def create_hooks():
    """Create custom hooks."""
    # Create useAuth hook
    auth_hook = """import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    loading: true,
    error: null,
  })
  
  const navigate = useNavigate()
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user data
      axios.get('/api/v1/auth/me', {
        headers: { Authorization: \`Bearer \${token}\` }
      })
      .then(response => {
        setState(prev => ({
          ...prev,
          user: response.data,
          loading: false
        }))
      })
      .catch(() => {
        localStorage.removeItem('token')
        setState(prev => ({
          ...prev,
          token: null,
          user: null,
          loading: false
        }))
      })
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])
  
  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/v1/auth/token', {
        username,
        password
      })
      
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setState(prev => ({
        ...prev,
        token,
        user,
        error: null
      }))
      
      navigate('/')
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Invalid credentials'
      }))
    }
  }
  
  const logout = () => {
    localStorage.removeItem('token')
    setState({
      user: null,
      token: null,
      loading: false,
      error: null
    })
    navigate('/login')
  }
  
  return {
    ...state,
    login,
    logout
  }
}
"""
    
    with open('frontend/src/hooks/useAuth.ts', 'w') as f:
        f.write(auth_hook)

def create_services():
    """Create API services."""
    # Create api.ts
    api_content = """import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`
  }
  return config
})

export default api
"""
    
    with open('frontend/src/services/api.ts', 'w') as f:
        f.write(api_content)

def create_styles():
    """Create style files."""
    # Create theme.ts
    theme_content = """import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
})
"""
    
    with open('frontend/src/styles/theme.ts', 'w') as f:
        f.write(theme_content)

def main():
    """Main function to run all frontend optimization steps."""
    print("Starting frontend optimization...")
    
    # Create directory structure
    create_frontend_structure()
    print("✓ Created directory structure")
    
    # Create base files
    create_base_files()
    print("✓ Created base files")
    
    # Create components
    create_component_files()
    print("✓ Created component files")
    
    # Create hooks
    create_hooks()
    print("✓ Created custom hooks")
    
    # Create services
    create_services()
    print("✓ Created API services")
    
    # Create styles
    create_styles()
    print("✓ Created style files")
    
    print("\nFrontend optimization complete!")

if __name__ == "__main__":
    main() 