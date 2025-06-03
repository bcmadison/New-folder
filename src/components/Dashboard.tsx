import React, { useEffect } from 'react';
import Navbar from './navigation/Navbar';
import PerformanceMetricsComponent from './PerformanceMetrics';
import ArbitrageOpportunities from './ArbitrageOpportunities';
import MoneyMaker from './MoneyMaker';
import ModelPerformance from './ModelPerformance';
import MLFactorViz from './MLFactorViz';
import LiveOddsTicker from './LiveOddsTicker';
import useStore from '../store/useStore';
import type {
  ModelMetrics,
  MLInsight,
  OddsUpdate,
  PlayerProp,
  Opportunity,
  PerformanceMetrics as PerformanceMetricsType
} from '../types';
import { webSocketService } from '../services/websocket';
import { LiveOddsTickerProps, BookOdds } from '../types/betting';

interface MetricItem {
  label: string;
  trend: 'up' | 'down' | 'neutral';
  value: number;
  change: number;
}

interface DashboardProps {
  initialMetrics: {
    monthlyPL: number;
    monthlyROI: number;
    aiAccuracy: number;
    activeArbitrage: number;
  };
}

interface ArbitrageAlertPayload extends Opportunity {
  potentialProfit: number;
  player: { name: string };
}

const Dashboard: React.FC<DashboardProps> = ({ initialMetrics }) => {
  const [metrics, setMetrics] = React.useState<MetricItem[]>([
    {
      label: 'Monthly P/L',
      value: initialMetrics.monthlyPL,
      change: 0,
      trend: 'neutral'
    },
    {
      label: 'ROI',
      value: initialMetrics.monthlyROI,
      change: 0,
      trend: 'neutral'
    },
    {
      label: 'AI Accuracy',
      value: initialMetrics.aiAccuracy,
      change: 0,
      trend: 'neutral'
    },
    {
      label: 'Active Arbitrage',
      value: initialMetrics.activeArbitrage,
      change: 0,
      trend: 'neutral'
    }
  ]);

  const [modelMetrics] = React.useState<ModelMetrics>({
    accuracy: 0.85,
    roi: 0.32,
    predictions: 1250,
    successRate: Array(30).fill(0).map(() => 0.7 + Math.random() * 0.2),
    dates: Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toLocaleDateString();
    })
  });

  const [mlInsights] = React.useState<MLInsight[]>([
    {
      factor: 'Historical Performance',
      description: 'Strong correlation with past results',
      impact: 1,
      confidence: 1
    },
    {
      factor: 'Weather Impact',
      description: 'Moderate influence on outdoor games',
      impact: 0,
      confidence: 1
    },
    {
      factor: 'Injury Status',
      description: 'Critical factor for player props',
      impact: 1,
      confidence: 1
    }
  ]);

  const [oddsUpdates, setOddsUpdates] = React.useState<OddsUpdate[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = React.useState<Opportunity[]>([]);
  const [selectedProp, setSelectedProp] = React.useState<PlayerProp | undefined>(undefined);
  const { addToast } = useStore();

  const oddsTickerData: Record<string, BookOdds> = React.useMemo(() => {
    const result: Record<string, BookOdds> = {};
    oddsUpdates.forEach((update) => {
      const market = `${update.sport}:${update.propType}`;
      if (!result[market]) result[market] = {};
      result[market][update.player] = update.newOdds;
    });
    return result;
  }, [oddsUpdates]);

  useEffect(() => {
    const unsubscribe = webSocketService.subscribe((message) => {
      switch (message.type) {
        case 'odds_update':
          setOddsUpdates(prev => [message.data as OddsUpdate, ...prev].slice(0, 10));
          break;
        case 'prop_update':
          setSelectedProp(message.data as PlayerProp);
          break;
        case 'arbitrage_alert':
          setArbitrageOpportunities(prev => [...prev, message.data as Opportunity]);
          const arb = message.data as ArbitrageAlertPayload;
          addToast({
            id: arb.id,
            type: 'info',
            message: `${arb.potentialProfit}% profit available on ${arb.player.name}`
          });
          break;
      }
    });

    webSocketService.connect();

    return () => {
      unsubscribe();
      webSocketService.disconnect();
    };
  }, [addToast]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceMetricsComponent metrics={metrics} />
            </div>
            <div>
              <LiveOddsTicker data={oddsTickerData} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <MoneyMaker />
            <MLFactorViz playerId={""} metric={""} />
          </div>

          <div className="grid grid-cols-1 gap-6 mt-6">
            <ModelPerformance analytics={{ winRate: 0, roi: 0, totalBets: 0, confidence: 1 }} />
            <ArbitrageOpportunities
              opportunities={arbitrageOpportunities as any}
              onSelect={(opportunity) => {
                addToast({
                  id: opportunity.id,
                  type: 'info',
                  message: `Calculating optimal stakes for ${opportunity.player.name}...`
                });
              }}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard; 