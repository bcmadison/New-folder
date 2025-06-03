import { UnifiedBettingAnalytics, BettingAnalysis, BettingStrategy } from '../services/unified/UnifiedBettingAnalytics';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';



interface UseBettingAnalyticsOptions {
  market: string;
  odds: number;
  stake: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface BettingAnalyticsState {
  analysis: BettingAnalysis | null;
  isLoading: boolean;
  error: Error | null;
  strategies: BettingStrategy[];
}

export function useBettingAnalytics({
  market,
  odds,
  stake,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: UseBettingAnalyticsOptions) {
  const analytics = UnifiedBettingAnalytics.getInstance();
  const [strategies, setStrategies] = useState<BettingStrategy[]>([]);

  // Fetch analysis using React Query
  const {
    data: analysis,
    isLoading,
    error,
    refetch,
  } = useQuery<BettingAnalysis, Error>(
    ['betting-analysis', market, odds, stake],
    () => analytics.analyzeBettingOpportunity(market, odds, stake),
    {
      enabled: Boolean(market && odds && stake),
      refetchInterval: autoRefresh ? refreshInterval : false,
      retry: 2,
    }
  );

  // Strategy mutations
  const { mutate: addStrategy } = useMutation(
    (strategy: BettingStrategy) => {
      analytics.addStrategy(strategy);
      return Promise.resolve(strategy);
    },
    {
      onSuccess: (strategy) => {
        setStrategies((prev) => [...prev, strategy]);
      },
    }
  );

  const { mutate: removeStrategy } = useMutation(
    (strategyId: string) => {
      analytics.removeStrategy(strategyId);
      return Promise.resolve(strategyId);
    },
    {
      onSuccess: (strategyId) => {
        setStrategies((prev) => prev.filter((s) => s.id !== strategyId));
      },
    }
  );

  // Subscribe to real-time updates
  useEffect(() => {
    const handleOddsMovement = (data: any) => {
      if (data.market === market) {
        refetch();
      }
    };

    const handlePredictionsUpdate = (data: any) => {
      if (data.market === market) {
        refetch();
      }
    };

    analytics.on('odds_movement', handleOddsMovement);
    analytics.on('predictions_updated', handlePredictionsUpdate);

    return () => {
      analytics.off('odds_movement', handleOddsMovement);
      analytics.off('predictions_updated', handlePredictionsUpdate);
    };
  }, [market, analytics, refetch]);

  // Utility functions
  const calculatePotentialProfit = useCallback(
    (betAmount: number) => {
      if (!analysis) return 0;
      return betAmount * (odds - 1);
    },
    [odds, analysis]
  );

  const getRecommendedStake = useCallback(() => {
    if (!analysis) return 0;
    return analysis.recommendedStake;
  }, [analysis]);

  const getRiskAssessment = useCallback(() => {
    if (!analysis) return { level: 'unknown' as const, factors: [] };
    return analysis.riskAssessment;
  }, [analysis]);

  return {
    analysis,
    isLoading,
    error,
    strategies,
    addStrategy,
    removeStrategy,
    calculatePotentialProfit,
    getRecommendedStake,
    getRiskAssessment,
    refetch,
  };
} 