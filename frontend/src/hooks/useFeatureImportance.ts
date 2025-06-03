import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface FeatureImportance {
  feature: string;
  importance: number;
  timestamp: string;
}

interface FeatureImportanceState {
  featureImportance: FeatureImportance[];
  loading: boolean;
  error: string | null;
}

export const useFeatureImportance = () => {
  const [state, setState] = useState<FeatureImportanceState>({
    featureImportance: [],
    loading: true,
    error: null
  });

  const { token } = useAuth();

  const fetchFeatureImportance = async () => {
    try {
      const response = await fetch('/api/predictions/feature-importance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feature importance');
      }

      const featureImportance = await response.json();
      setState(prev => ({
        ...prev,
        featureImportance,
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

  const getTopFeatures = (count: number = 10) => {
    return [...state.featureImportance]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, count);
  };

  const getFeatureHistory = (feature: string) => {
    return state.featureImportance
      .filter(fi => fi.feature === feature)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getFeatureTrend = (feature: string) => {
    const history = getFeatureHistory(feature);
    return history.map(h => ({
      timestamp: h.timestamp,
      importance: h.importance
    }));
  };

  const getFeatureCorrelation = (feature1: string, feature2: string) => {
    const history1 = getFeatureHistory(feature1);
    const history2 = getFeatureHistory(feature2);

    if (history1.length !== history2.length) return null;

    const n = history1.length;
    let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;

    for (let i = 0; i < n; i++) {
      const x = history1[i].importance;
      const y = history2[i].importance;
      sum1 += x;
      sum2 += y;
      sum1Sq += x * x;
      sum2Sq += y * y;
      pSum += x * y;
    }

    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    return den === 0 ? 0 : num / den;
  };

  useEffect(() => {
    if (token) {
      fetchFeatureImportance();
    }
  }, [token]);

  return {
    featureImportance: state.featureImportance,
    loading: state.loading,
    error: state.error,
    fetchFeatureImportance,
    getTopFeatures,
    getFeatureHistory,
    getFeatureTrend,
    getFeatureCorrelation
  };
}; 