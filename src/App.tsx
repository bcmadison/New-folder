import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import ArbitragePage from './pages/ArbitragePage';
import BankrollPage from './pages/BankrollPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MoneyMakerPage from './pages/MoneyMakerPage';
import LineupBuilderPage from './pages/LineupBuilderPage';
import { StrategiesPage } from '@/pages/StrategiesPage';
import { PropsPage } from '@/pages/PropsPage';
import { authService } from './services/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="arbitrage" element={<ArbitragePage />} />
            <Route path="bankroll" element={<BankrollPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="money-maker" element={<MoneyMakerPage />} />
            <Route path="lineup-builder" element={<LineupBuilderPage />} />
            <Route path="strategies" element={<StrategiesPage />} />
            <Route path="props" element={<PropsPage />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </ThemeProvider>
  );
};

export default App; 