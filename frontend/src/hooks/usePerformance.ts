import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface PerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  roc_auc: number;
  mae: number;
  rmse: number;
}

interface ModelPerformance {
  model: string;
  metrics: PerformanceMetrics;
  timestamp: string;
}

interface PerformanceState {
  performance: ModelPerformance[];
  loading: boolean;
  error: string | null;
}

export const usePerformance = () => {
  const [state, setState] = useState<PerformanceState>({
    performance: [],
    loading: true,
    error: null
  });

  const { token } = useAuth();

  const fetchPerformance = async () => {
    try {
      const response = await fetch('/api/predictions/model-performance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch model performance');
      }

      const performance = await response.json();
      setState(prev => ({
        ...prev,
        performance,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      }));
    }
  };

  const getLatestPerformance = () => {
    if (state.performance.length === 0) return null;
    return state.performance[state.performance.length - 1];
  };

  const getPerformanceHistory = (model: string) => {
    return state.performance.filter(p => p.model === model);
  };

  const getBestModel = () => {
    if (state.performance.length === 0) return null;
    return state.performance.reduce((best, current) => {
      const bestScore = best.metrics.f1;
      const currentScore = current.metrics.f1;
      return currentScore > bestScore ? current : best;
    });
  };

  const getPerformanceTrend = (model: string, metric: keyof PerformanceMetrics) => {
    const history = getPerformanceHistory(model);
    return history.map(p => ({
      timestamp: p.timestamp,
      value: p.metrics[metric]
    }));
  };

  useEffect(() => {
    if (token) {
      fetchPerformance();
    }
  }, [token]);

  return {
    performance: state.performance,
    loading: state.loading,
    error: state.error,
    fetchPerformance,
    getLatestPerformance,
    getPerformanceHistory,
    getBestModel,
    getPerformanceTrend
  };
}; 