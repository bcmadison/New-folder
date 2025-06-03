#!/usr/bin/env python3
"""
Frontend Consolidation Script
Consolidates and optimizes the frontend code structure
"""

import os
import shutil
import json
from pathlib import Path
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'logs/frontend_consolidation_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)

class FrontendConsolidator:
    def __init__(self):
        self.root_dir = Path.cwd()
        self.final_app_dir = self.root_dir / 'finalApp'
        self.frontend_dir = self.final_app_dir / 'frontend'
        self.source_dirs = {
            'components': self.root_dir / 'frontend' / 'src' / 'components',
            'services': self.root_dir / 'frontend' / 'src' / 'services',
            'hooks': self.root_dir / 'frontend' / 'src' / 'hooks',
            'store': self.root_dir / 'frontend' / 'src' / 'store',
            'utils': self.root_dir / 'frontend' / 'src' / 'utils',
            'pages': self.root_dir / 'frontend' / 'src' / 'pages'
        }

    def consolidate(self):
        """Main consolidation process"""
        logging.info("Starting frontend consolidation...")
        
        # Create necessary directories
        self._create_directories()
        
        # Consolidate components
        self._consolidate_components()
        
        # Consolidate services
        self._consolidate_services()
        
        # Consolidate hooks
        self._consolidate_hooks()
        
        # Consolidate store
        self._consolidate_store()
        
        # Consolidate utils
        self._consolidate_utils()
        
        # Create package.json
        self._create_package_json()
        
        # Create vite.config.ts
        self._create_vite_config()
        
        # Create tsconfig.json
        self._create_tsconfig()
        
        logging.info("Frontend consolidation complete!")

    def _create_directories(self):
        """Create necessary directory structure"""
        directories = [
            'src/components/lineup',
            'src/components/predictions',
            'src/components/analytics',
            'src/components/common',
            'src/hooks',
            'src/services',
            'src/store/slices',
            'src/utils',
            'src/pages',
            'src/types',
            'src/styles',
            'tests'
        ]
        
        for dir_path in directories:
            (self.frontend_dir / dir_path).mkdir(parents=True, exist_ok=True)
            logging.info(f"Created directory: {dir_path}")

    def _consolidate_components(self):
        """Consolidate React components"""
        component_files = {
            'lineup/LineupBuilder.tsx': self._merge_lineup_builder(),
            'predictions/PredictionCard.tsx': self._merge_prediction_card(),
            'analytics/AnalyticsDashboard.tsx': self._merge_analytics_dashboard(),
            'common/Layout.tsx': self._merge_layout(),
            'common/Navbar.tsx': self._merge_navbar()
        }
        
        for filename, content in component_files.items():
            with open(self.frontend_dir / 'src' / 'components' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_services(self):
        """Consolidate service layer"""
        service_files = {
            'api.ts': self._merge_api_service(),
            'auth.ts': self._merge_auth_service(),
            'ml.ts': self._merge_ml_service()
        }
        
        for filename, content in service_files.items():
            with open(self.frontend_dir / 'src' / 'services' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_hooks(self):
        """Consolidate custom hooks"""
        hook_files = {
            'useAuth.ts': self._merge_auth_hook(),
            'usePredictions.ts': self._merge_predictions_hook(),
            'useAnalytics.ts': self._merge_analytics_hook()
        }
        
        for filename, content in hook_files.items():
            with open(self.frontend_dir / 'src' / 'hooks' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_store(self):
        """Consolidate state management"""
        store_files = {
            'slices/authSlice.ts': self._merge_auth_slice(),
            'slices/predictionsSlice.ts': self._merge_predictions_slice(),
            'slices/analyticsSlice.ts': self._merge_analytics_slice(),
            'index.ts': self._merge_store_index()
        }
        
        for filename, content in store_files.items():
            with open(self.frontend_dir / 'src' / 'store' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _consolidate_utils(self):
        """Consolidate utility functions"""
        util_files = {
            'formatters.ts': self._merge_formatters(),
            'validators.ts': self._merge_validators(),
            'constants.ts': self._merge_constants()
        }
        
        for filename, content in util_files.items():
            with open(self.frontend_dir / 'src' / 'utils' / filename, 'w') as f:
                f.write(content)
            logging.info(f"Consolidated {filename}")

    def _create_package_json(self):
        """Create package.json with dependencies"""
        package_json = {
            "name": "ai-sports-betting-platform",
            "version": "2.0.0",
            "private": True,
            "scripts": {
                "dev": "vite",
                "build": "tsc && vite build",
                "preview": "vite preview",
                "test": "jest",
                "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
            },
            "dependencies": {
                "@reduxjs/toolkit": "^1.9.5",
                "axios": "^1.4.0",
                "framer-motion": "^10.13.0",
                "react": "^18.2.0",
                "react-dom": "^18.2.0",
                "react-redux": "^8.1.2",
                "react-router-dom": "^6.14.2",
                "recharts": "^2.7.2",
                "tailwindcss": "^3.3.3",
                "zustand": "^4.3.9"
            },
            "devDependencies": {
                "@types/react": "^18.2.15",
                "@types/react-dom": "^18.2.7",
                "@typescript-eslint/eslint-plugin": "^6.0.0",
                "@typescript-eslint/parser": "^6.0.0",
                "@vitejs/plugin-react": "^4.0.3",
                "autoprefixer": "^10.4.14",
                "eslint": "^8.45.0",
                "eslint-plugin-react-hooks": "^4.6.0",
                "eslint-plugin-react-refresh": "^0.4.3",
                "jest": "^29.6.2",
                "postcss": "^8.4.27",
                "typescript": "^5.0.2",
                "vite": "^4.4.5"
            }
        }
        
        with open(self.frontend_dir / 'package.json', 'w') as f:
            json.dump(package_json, f, indent=2)
        logging.info("Created package.json")

    def _create_vite_config(self):
        """Create Vite configuration"""
        vite_config = '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@store': path.resolve(__dirname, './src/store'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
'''
        
        with open(self.frontend_dir / 'vite.config.ts', 'w') as f:
            f.write(vite_config)
        logging.info("Created vite.config.ts")

    def _create_tsconfig(self):
        """Create TypeScript configuration"""
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
                    "@/*": ["src/*"],
                    "@components/*": ["src/components/*"],
                    "@services/*": ["src/services/*"],
                    "@hooks/*": ["src/hooks/*"],
                    "@store/*": ["src/store/*"],
                    "@utils/*": ["src/utils/*"]
                }
            },
            "include": ["src"],
            "references": [{"path": "./tsconfig.node.json"}]
        }
        
        with open(self.frontend_dir / 'tsconfig.json', 'w') as f:
            json.dump(tsconfig, f, indent=2)
        logging.info("Created tsconfig.json")

    # Helper methods for merging files
    def _merge_lineup_builder(self):
        """Merge lineup builder component"""
        return '''import React from 'react';
import { usePredictions } from '@hooks/usePredictions';
import { useAnalytics } from '@hooks/useAnalytics';

export const LineupBuilder: React.FC = () => {
  const { predictions, loading } = usePredictions();
  const { optimizeLineup } = useAnalytics();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Lineup Builder</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="p-4 border rounded-lg shadow">
              <h3 className="font-bold">{prediction.player}</h3>
              <p>Projected: {prediction.projected}</p>
              <p>Confidence: {prediction.confidence}%</p>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={optimizeLineup}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Optimize Lineup
      </button>
    </div>
  );
};
'''

    def _merge_prediction_card(self):
        """Merge prediction card component"""
        return '''import React from 'react';
import { motion } from 'framer-motion';

interface PredictionCardProps {
  player: string;
  projected: number;
  confidence: number;
  onClick?: () => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  player,
  projected,
  confidence,
  onClick
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="p-4 border rounded-lg shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-bold">{player}</h3>
      <p>Projected: {projected}</p>
      <p>Confidence: {confidence}%</p>
    </motion.div>
  );
};
'''

    def _merge_analytics_dashboard(self):
        """Merge analytics dashboard component"""
        return '''import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAnalytics } from '@hooks/useAnalytics';

export const AnalyticsDashboard: React.FC = () => {
  const { performanceData, loading } = useAnalytics();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="w-full h-96">
          <LineChart
            width={800}
            height={400}
            data={performanceData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="accuracy" stroke="#8884d8" />
          </LineChart>
        </div>
      )}
    </div>
  );
};
'''

    def _merge_layout(self):
        """Merge layout component"""
        return '''import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
'''

    def _merge_navbar(self):
        """Merge navbar component"""
        return '''import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              AI Sports Betting
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-blue-500">
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
'''

    def _merge_api_service(self):
        """Merge API service"""
        return '''import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getPredictions = async () => {
  const response = await api.get('/predictions');
  return response.data;
};

export const getLineups = async () => {
  const response = await api.get('/lineups');
  return response.data;
};

export const getAnalytics = async () => {
  const response = await api.get('/analytics');
  return response.data;
};

export default api;
'''

    def _merge_auth_service(self):
        """Merge auth service"""
        return '''import api from './api';

export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (email: string, password: string) => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
'''

    def _merge_ml_service(self):
        """Merge ML service"""
        return '''import api from './api';

export const getPredictions = async () => {
  const response = await api.get('/predictions');
  return response.data;
};

export const analyzePrediction = async (predictionId: number) => {
  const response = await api.post(`/predictions/${predictionId}/analyze`);
  return response.data;
};

export const optimizeLineup = async (constraints: any) => {
  const response = await api.post('/lineups/optimize', constraints);
  return response.data;
};
'''

    def _merge_auth_hook(self):
        """Merge auth hook"""
        return '''import { useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '@services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentUser();
        setUser(user);
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await apiLogin(email, password);
    setUser(user);
    return user;
  };

  const register = async (email: string, password: string) => {
    const user = await apiRegister(email, password);
    setUser(user);
    return user;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout
  };
};
'''

    def _merge_predictions_hook(self):
        """Merge predictions hook"""
        return '''import { useState, useEffect } from 'react';
import { getPredictions } from '@services/ml';

export const usePredictions = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await getPredictions();
        setPredictions(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  return {
    predictions,
    loading,
    error
  };
};
'''

    def _merge_analytics_hook(self):
        """Merge analytics hook"""
        return '''import { useState, useEffect } from 'react';
import { getAnalytics, optimizeLineup as apiOptimizeLineup } from '@services/api';

export const useAnalytics = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getAnalytics();
        setPerformanceData(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const optimizeLineup = async (constraints) => {
    try {
      const result = await apiOptimizeLineup(constraints);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    performanceData,
    loading,
    error,
    optimizeLineup
  };
};
'''

    def _merge_auth_slice(self):
        """Merge auth slice"""
        return '''import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
    }
  }
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
'''

    def _merge_predictions_slice(self):
        """Merge predictions slice"""
        return '''import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Prediction {
  id: number;
  player: string;
  projected: number;
  confidence: number;
}

interface PredictionsState {
  predictions: Prediction[];
  loading: boolean;
  error: string | null;
}

const initialState: PredictionsState = {
  predictions: [],
  loading: false,
  error: null
};

const predictionsSlice = createSlice({
  name: 'predictions',
  initialState,
  reducers: {
    setPredictions: (state, action: PayloadAction<Prediction[]>) => {
      state.predictions = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { setPredictions, setLoading, setError } = predictionsSlice.actions;
export default predictionsSlice.reducer;
'''

    def _merge_analytics_slice(self):
        """Merge analytics slice"""
        return '''import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AnalyticsState {
  performanceData: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  performanceData: [],
  loading: false,
  error: null
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setPerformanceData: (state, action: PayloadAction<any[]>) => {
      state.performanceData = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { setPerformanceData, setLoading, setError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
'''

    def _merge_store_index(self):
        """Merge store index"""
        return '''import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import predictionsReducer from './slices/predictionsSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    predictions: predictionsReducer,
    analytics: analyticsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
'''

    def _merge_formatters(self):
        """Merge formatters"""
        return '''export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};
'''

    def _merge_validators(self):
        """Merge validators"""
        return '''export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000;
};
'''

    def _merge_constants(self):
        """Merge constants"""
        return '''export const API_BASE_URL = '/api';
export const AUTH_TOKEN_KEY = 'token';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PREDICTIONS: '/predictions',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings'
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me'
  },
  PREDICTIONS: {
    LIST: '/predictions',
    ANALYZE: '/predictions/analyze'
  },
  LINEUPS: {
    LIST: '/lineups',
    OPTIMIZE: '/lineups/optimize'
  },
  ANALYTICS: {
    PERFORMANCE: '/analytics/performance',
    TRENDS: '/analytics/trends'
  }
};
'''

if __name__ == "__main__":
    consolidator = FrontendConsolidator()
    consolidator.consolidate() 