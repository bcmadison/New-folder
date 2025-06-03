import React, { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import './errorLogger.js';
import AppRoutes from './routes/AppRoutes';
import ToggleSidebar from './components/ToggleSidebar';
import FooterVersion from './components/FooterVersion';
import { ToastProvider } from './components/ToastContext';
import DarkModeToggle from './components/DarkModeToggle';
import ApiHealthIndicator from './components/ApiHealthIndicator';
import { ErrorBoundary } from 'react-error-boundary';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ToastProvider>
      <BrowserRouter>
        <ErrorBoundary FallbackComponent={({error}) => <div className="p-4 text-red-600">App Error: {error.message}</div>}>
          <div className="flex h-screen w-screen overflow-hidden dark:bg-gray-900 dark:text-gray-100">
            <ToggleSidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(o => !o)}
            />
            <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              <div className="flex justify-end mb-2 gap-2 items-center">
                <ApiHealthIndicator />
                <DarkModeToggle />
              </div>
              <AppRoutes />
              <FooterVersion />
            </div>
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </ToastProvider>
  );
}
