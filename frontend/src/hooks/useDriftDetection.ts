import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface DriftPoint {
  timestamp: string;
  value: number;
  threshold: number;
  is_drift: boolean;
  feature?: string;
}

interface DriftState {
  drift: DriftPoint[];
  loading: boolean;
  error: string | null;
}

export const useDriftDetection = () => {
  const [state, setState] = useState<DriftState>({
    drift: [],
    loading: true,
    error: null
  });

  const { token } = useAuth();

  const fetchDrift = async () => {
    try {
      const response = await fetch('/api/predictions/drift-detection', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drift detection data');
      }

      const drift = await response.json();
      setState(prev => ({
        ...prev,
        drift,
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

  const getLatestDrift = () => {
    if (state.drift.length === 0) return null;
    return state.drift[state.drift.length - 1];
  };

  const getDriftHistory = (feature?: string) => {
    return state.drift
      .filter(d => !feature || d.feature === feature)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getDriftTrend = (feature?: string) => {
    const history = getDriftHistory(feature);
    return history.map(h => ({
      timestamp: h.timestamp,
      value: h.value,
      threshold: h.threshold
    }));
  };

  const getDriftAlerts = () => {
    return state.drift.filter(d => d.is_drift);
  };

  const getDriftSeverity = (driftPoint: DriftPoint) => {
    const deviation = Math.abs(driftPoint.value - driftPoint.threshold);
    const thresholdRange = driftPoint.threshold * 0.1; // 10% of threshold

    if (deviation > thresholdRange * 2) return 'high';
    if (deviation > thresholdRange) return 'medium';
    return 'low';
  };

  const getDriftFeatures = () => {
    const features = new Set<string>();
    state.drift.forEach(d => {
      if (d.feature) features.add(d.feature);
    });
    return Array.from(features);
  };

  const getDriftSummary = () => {
    const alerts = getDriftAlerts();
    const features = getDriftFeatures();
    const summary = {
      total_alerts: alerts.length,
      features_with_drift: features.filter(f => 
        alerts.some(a => a.feature === f)
      ).length,
      severity_counts: {
        high: alerts.filter(a => getDriftSeverity(a) === 'high').length,
        medium: alerts.filter(a => getDriftSeverity(a) === 'medium').length,
        low: alerts.filter(a => getDriftSeverity(a) === 'low').length
      }
    };
    return summary;
  };

  useEffect(() => {
    if (token) {
      fetchDrift();
    }
  }, [token]);

  return {
    drift: state.drift,
    loading: state.loading,
    error: state.error,
    fetchDrift,
    getLatestDrift,
    getDriftHistory,
    getDriftTrend,
    getDriftAlerts,
    getDriftSeverity,
    getDriftFeatures,
    getDriftSummary
  };
}; 