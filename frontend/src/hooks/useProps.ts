import useStore from '../store/useStore';
import { Opportunity } from '../types/core';
import { PlayerProp, Sport, PropType } from '../types';
import { apiService } from '../services/api';
import { useState, useEffect, useCallback } from 'react';
import { webSocketService } from '../services/websocket';


interface UsePropsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  sport?: Sport;
  propType?: PropType;
}

export const useProps = ({
  autoRefresh = true,
  refreshInterval = 30000,
  sport,
  propType
}: UsePropsOptions = {}) => {
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useStore();

  const fetchProps = useCallback(async () => {
    try {
      const [propsData, arbitrageData] = await Promise.all([
        apiService.getProps({ sport, type: propType }),
        apiService.getArbitrageOpportunities()
      ]);

      setProps(propsData);
      setOpportunities(
        (arbitrageData as any[]).map((item) => ({
          ...item,
          propId: item.id,
          analysis: {
            historicalTrends: [],
            marketSignals: [],
            riskFactors: []
          }
        }))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch props'));
      addToast({
        id: 'props-error',
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch props data'
      });
    } finally {
      setIsLoading(false);
    }
  }, [sport, propType, addToast]);

  useEffect(() => {
    fetchProps();

    if (autoRefresh) {
      const interval = setInterval(fetchProps, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchProps, autoRefresh, refreshInterval]);

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe((message) => {
      switch (message.type) {
        case 'prop_update':
          setProps(prev => {
            const data = message.data as PlayerProp;
            const index = prev.findIndex(p => p.id === data.id);
            if (index === -1) return [...prev, data];
            const updated = [...prev];
            updated[index] = data;
            return updated;
          });
          break;
        case 'arbitrage_alert':
          setOpportunities(prev => [...prev, message.data as Opportunity]);
          const opp = message.data as Opportunity & { potentialProfit?: number; player?: { name: string } };
          addToast({
            id: opp.id,
            type: 'info',
            title: 'New Arbitrage Opportunity',
            message: `${opp.potentialProfit ?? ''}% profit available on ${opp.player?.name ?? ''}`
          });
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addToast]);

  const refreshProps = () => {
    setIsLoading(true);
    fetchProps();
  };

  return {
    props,
    opportunities,
    isLoading,
    error,
    refreshProps
  };
}; 