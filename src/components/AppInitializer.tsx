import React, { useEffect, useState } from 'react';
import { UnifiedBettingSystem } from '../core/UnifiedBettingSystem';
import { UnifiedDataEngine } from '../core/UnifiedDataEngine';
import { UnifiedPredictionEngine } from '../core/UnifiedPredictionEngine';
import { UnifiedStrategyEngine } from '../core/UnifiedStrategyEngine';
import { UnifiedConfigManager } from '../core/UnifiedConfig';
import { UnifiedStateManager } from '../core/UnifiedState';
import { UnifiedMonitor } from '../core/UnifiedMonitor';

interface AppInitializerProps {
  children: React.ReactNode;
}

export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const monitor = UnifiedMonitor.getInstance();
        const configManager = UnifiedConfigManager.getInstance();
        const stateManager = UnifiedStateManager.getInstance();
        const dataEngine = UnifiedDataEngine.getInstance();
        const predictionEngine = UnifiedPredictionEngine.getInstance();
        const strategyEngine = UnifiedStrategyEngine.getInstance();
        const bettingSystem = UnifiedBettingSystem.getInstance();

        // Initialize in the correct order
        await configManager.loadConfig();
        await stateManager.initialize();
        await dataEngine.connect();
        await strategyEngine.initialize();
        await bettingSystem.initialize();

        monitor.recordMetric('system', {
          initialization: 'success',
          timestamp: Date.now()
        });

        setIsInitialized(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown initialization error');
        setError(error);
        const monitor = UnifiedMonitor.getInstance();
        monitor.logError('initialization', error);
      }
    };

    initializeApp();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-lg font-medium text-red-900">Initialization Error</h2>
              <p className="mt-2 text-sm text-red-600">{error.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-lg font-medium text-gray-900">Initializing System</h2>
              <p className="mt-2 text-sm text-gray-500">Please wait while we set up the application...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 