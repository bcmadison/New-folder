import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import AnalyticsPage from './pages/AnalyticsPage';
import ArbitragePage from './pages/ArbitragePage';
import AuthPage from './pages/AuthPage';
import BankrollPage from './pages/BankrollPage';
import PrizePicksPage from './pages/PrizePicksPage';
import RiskManagerPage from './pages/RiskManagerPage';
import SettingsPage from './pages/SettingsPage';
import PerformanceDashboard from './components/monitoring/PerformanceDashboard';

// Components
import AppShell from './components/layout/AppShell';
import Dashboard from './components/dashboard/Dashboard';
import EntryTracking from './components/tracking/EntryTracking';
import ErrorBoundary from './components/common/ErrorBoundary';
import MoneyMaker from './components/betting/MoneyMaker';
import { performanceService } from './services/performanceService';

// Services
import { PrizePicksService } from './services/prizePicksService';
import { WebSocketService } from './services/webSocketService';
import { useStore } from './store/useStore';
import { performanceMonitor } from './utils/performanceMonitor';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App: React.FC = () => {
  const { darkMode, user } = useStore();

  useEffect(() => {
    // Initialize services
    const initServices = async () => {
      try {
        performanceMonitor.startMeasure('app-initialization');
        
        // Initialize WebSocket
        const wsService = WebSocketService.getInstance();
        await wsService.connect();
        
        // Initialize PrizePicks service
        const ppService = PrizePicksService.getInstance();
        await ppService.initialize();
        
        // Set up dark mode
        if (darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        performanceMonitor.endMeasure('app-initialization');
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    initServices();
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary>
          <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
            <ToastContainer position="top-right" autoClose={5000} />
            {user ? (
              <AppShell>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/props" element={<PrizePicksPage />} />
                  <Route path="/money-maker" element={<MoneyMaker />} />
                  <Route path="/entries" element={<EntryTracking />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/arbitrage" element={<ArbitragePage />} />
                  <Route path="/bankroll" element={<BankrollPage />} />
                  <Route path="/risk" element={<RiskManagerPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/monitoring" element={<PerformanceDashboard />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppShell>
            ) : (
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </Routes>
            )}
          </div>
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
};

export default App; 