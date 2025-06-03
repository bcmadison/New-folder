import { useState, useEffect, useCallback } from 'react';
import { PlayerProp, Sport, PropType, OddsUpdate, Opportunity } from '../types';
import { webSocketService } from '../services/websocket';
import { apiService } from '../services/api';
import useStore from '../store/useStore';

interface UseBettingDataOptions {
  sport?: Sport;
  propType?: PropType;
  autoRefresh?: boolean;
  refreshInterval?: number;
  minOddsChange?: number;
  onNewOpportunity?: (opportunity: Opportunity) => void;
}

export const useBettingData = ({
  sport,
  propType,
  autoRefresh = true,
  refreshInterval = 30000,
  minOddsChange = 0.1,
  onNewOpportunity
}: UseBettingDataOptions = {}) => {
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [oddsUpdates, setOddsUpdates] = useState<OddsUpdate[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useStore();

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [propsData, arbitrageData] = await Promise.all([
        apiService.getProps({ sport, type: propType }),
        apiService.getArbitrageOpportunities()
      ]);

      setProps(propsData);
      setOpportunities(arbitrageData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      addToast({
        id: 'data-error',
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch betting data'
      });
    } finally {
      setIsLoading(false);
    }
  }, [sport, propType, addToast]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
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

      case 'odds_update':
        const update = message.data as OddsUpdate;
        
        // Filter by sport and prop type if specified
        if (sport && update.sport !== sport) return;
        if (propType && update.propType !== propType) return;

        // Only show significant changes
        const oddsChange = Math.abs(update.newOdds - update.oldOdds);
        if (oddsChange < minOddsChange) return;

        setOddsUpdates(prev => {
          const newUpdates = [update, ...prev].slice(0, 50); // Keep last 50 updates
          return newUpdates;
        });

        // Notify on significant changes
        if (oddsChange >= 0.5) {
          addToast({
            id: `odds-update-${update.id}`,
            type: 'info',
            title: 'Significant Odds Movement',
            message: `${update.player} ${update.propType} line has moved from ${update.oldOdds} to ${update.newOdds}`
          });
        }
        break;

      case 'arbitrage_alert':
        const opportunity = message.data as Opportunity;
        setOpportunities(prev => [...prev, opportunity]);
        onNewOpportunity?.(opportunity);
        
        addToast({
          id: opportunity.id,
          type: 'info',
          title: 'New Arbitrage Opportunity',
          message: `${opportunity.potentialProfit}% profit available on ${opportunity.player?.name}`
        });
        break;
    }
  }, [sport, propType, minOddsChange, addToast, onNewOpportunity]);

  // Initialize WebSocket connection
  useEffect(() => {
    const wsConnection = webSocketService.connect({
      onMessage: handleWebSocketMessage,
      onConnected: () => setIsConnected(true),
      onDisconnected: () => setIsConnected(false)
    });

    return () => {
      wsConnection.disconnect();
    };
  }, [handleWebSocketMessage]);

  // Setup auto-refresh
  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  const refresh = () => {
    setIsLoading(true);
    fetchData();
  };

  return {
    props,
    oddsUpdates,
    opportunities,
    isLoading,
    isConnected,
    error,
    refresh
  };
}; 