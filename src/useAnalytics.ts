import { BetRecord, ClvAnalysis } from '../types/core';
import { BettingContext, BettingDecision, PerformanceMetrics } from '../types';
import { UnifiedBettingSystem } from '../core/UnifiedBettingSystem';
import { useDataSync } from './useDataSync';
import { useState, useEffect, useCallback } from 'react';



interface UseAnalyticsOptions {
  playerId?: string;
  metric?: string;
  minConfidence?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onNewDecision?: (decision: BettingDecision) => void;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

interface AnalyticsState {
  decision: BettingDecision | null;
  performance: PerformanceMetrics;
  clvAnalysis: Record<string, ClvAnalysis>;
  isAnalyzing: boolean;
  error: Error | null;
}

export function useAnalytics({
  playerId,
  metric,
  minConfidence = 0.6,
  autoRefresh = true,
  refreshInterval = 30000,
  onNewDecision,
  onPerformanceUpdate
}: UseAnalyticsOptions = {}) {
  const [state, setState] = useState<AnalyticsState>({
    decision: null,
    performance: {
      clvAverage: 0,
      edgeRetention: 0,
      kellyMultiplier: 0,
      marketEfficiencyScore: 0,
      profitByStrategy: {},
      variance: 0,
      sharpeRatio: 0,
      averageClv: 0,
      sharpnessScore: 0,
      totalBets: 0,
      winRate: 0,
      roi: 0
    },
    clvAnalysis: {},
    isAnalyzing: false,
    error: null
  });

  const bettingSystem = UnifiedBettingSystem.getInstance();

  // Sync betting history with local storage
  const { data: bettingHistory } = useDataSync<BetRecord[]>({
    key: 'betting-history',
    initialData: [],
    syncInterval: 60000
  });

  // Analyze betting opportunity
  const analyze = useCallback(async () => {
    if (!playerId || !metric) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));

    try {
      const context: BettingContext = {
        playerId,
        metric,
        timestamp: Date.now(),
        marketState: 'active',
        correlationFactors: []
      };

      const decision = await bettingSystem.analyzeBettingOpportunity(context);
      
      if (decision.confidence >= minConfidence) {
        setState(prev => ({ ...prev, decision }));
        onNewDecision?.(decision);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Analysis failed');
      setState(prev => ({ ...prev, error }));
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [playerId, metric, minConfidence, bettingSystem, onNewDecision]);

  // Update performance metrics
  const updatePerformanceMetrics = useCallback(() => {
    if (!bettingHistory?.length) return;

    try {
      const metrics = bettingSystem.calculatePerformanceMetrics(bettingHistory);
      
      setState(prev => ({
        ...prev,
        performance: metrics
      }));

      onPerformanceUpdate?.(metrics);

      // Update CLV analysis for recent bets
      const recentBets = bettingHistory
        .filter(bet => bet.result !== 'PENDING')
        .slice(0, 50); // Analyze last 50 bets

      const clvAnalysis = recentBets.reduce((acc, bet) => ({
        ...acc,
        [bet.id]: bettingSystem.analyzeClv(bet)
      }), {});

      setState(prev => ({
        ...prev,
        clvAnalysis
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update metrics');
      setState(prev => ({ ...prev, error }));
    }
  }, [bettingHistory, bettingSystem, onPerformanceUpdate]);

  // Auto-refresh analysis
  useEffect(() => {
    analyze();

    if (autoRefresh && playerId && metric) {
      const interval = setInterval(analyze, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [analyze, autoRefresh, playerId, metric, refreshInterval]);

  // Update metrics when betting history changes
  useEffect(() => {
    updatePerformanceMetrics();
  }, [updatePerformanceMetrics, bettingHistory]);

  return {
    ...state,
    analyze,
    updatePerformanceMetrics
  };
} 