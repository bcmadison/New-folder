
export interface PredictionData {
  value: number;
  confidence: number;
  timestamp: number;
}

export interface BookOdds {
  [bookmaker: string]: number;
}

export interface PlayerProjection {
  value: number;
  high: number;
  low: number;
  confidence: number;
}

export interface SentimentData {
  score: number;
  volume: number;
  trend: 'positive' | 'negative' | 'neutral';
  sources: {
    social: number;
    news: number;
    betting: number;
  };
}

export interface RealtimeData {
  odds: {
    [market: string]: BookOdds;
  };
  projections: {
    [playerId: string]: {
      [metric: string]: PlayerProjection;
    };
  };
  sentiment: {
    [playerId: string]: SentimentData;
  };
}

export interface LiveOddsTickerProps {
  data?: Record<string, BookOdds>;
  className?: string;
}

export interface AnalyticsMetrics {
  winRate: number;
  roi: number;
  totalBets: number;
  confidence: number;
}

export interface BettingAlert {
  type: 'opportunity' | 'warning' | 'info';
  message: string;
  data: {
    prediction: PredictionData;
    strategy: unknown;
  };
} 