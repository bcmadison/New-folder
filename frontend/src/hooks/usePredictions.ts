import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Prediction {
  id: string;
  player: string;
  stat: string;
  value: number;
  confidence: number;
  sport: string;
  game_time: string;
  odds: number;
  features: Record<string, any>;
  actual_outcome?: number;
  is_test: boolean;
}

interface PredictionsState {
  predictions: Prediction[];
  loading: boolean;
  error: string | null;
}

export const usePredictions = () => {
  const [state, setState] = useState<PredictionsState>({
    predictions: [],
    loading: true,
    error: null
  });

  const { token } = useAuth();

  const fetchPredictions = async (date?: string) => {
    try {
      const url = date
        ? `/api/predictions?date=${date}`
        : '/api/predictions';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const predictions = await response.json();
      setState(prev => ({
        ...prev,
        predictions,
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

  const optimizeLineup = async (selectedPredictions: string[], numLegs: number) => {
    try {
      const response = await fetch('/api/predictions/optimize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prediction_ids: selectedPredictions,
          num_legs: numLegs
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize lineup');
      }

      const optimizedLineup = await response.json();
      return optimizedLineup;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      throw error;
    }
  };

  const getFeatureImportance = async () => {
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
      return featureImportance;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      throw error;
    }
  };

  const getModelPerformance = async () => {
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
      return performance;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      throw error;
    }
  };

  const getOddsUpdates = async () => {
    try {
      const response = await fetch('/api/predictions/odds-updates', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch odds updates');
      }

      const oddsUpdates = await response.json();
      return oddsUpdates;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred'
      }));
      throw error;
    }
  };

  useEffect(() => {
    if (token) {
      fetchPredictions();
    }
  }, [token]);

  return {
    predictions: state.predictions,
    loading: state.loading,
    error: state.error,
    fetchPredictions,
    optimizeLineup,
    getFeatureImportance,
    getModelPerformance,
    getOddsUpdates
  };
}; 