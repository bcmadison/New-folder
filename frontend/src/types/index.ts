
// Re-export all types from core, betting, and prizePicks
export * from './core';
export * from './betting';
export * from './prizePicks';

export interface ArbitrageOpportunity {
  id: string;
  sport: string;
  player: {
    id: string;
    name: string;
    team: {
      id: string;
      name: string;
      abbreviation: string;
      sport: string;
      colors: {
        primary: string;
        secondary: string;
      };
    };
    position: string;
    imageUrl: string;
    stats: Record<string, unknown>;
    form: number;
  };
  propType: string;
  books: Array<{
    name: string;
    odds: number;
    line: number;
  }>;
  potentialProfit: number;
  expiresAt: string;
  description?: string;
  meta?: Record<string, unknown>;
}

export interface BettingContext {
  playerId: string;
  metric: string;
  timestamp: number;
  marketState: 'active' | 'suspended' | 'closed';
  correlationFactors: string[];
}

export interface PredictionResult {
  confidence: number;
  predictedValue: number;
  factors: string[];
  timestamp: number;
}

export interface BettingDecision {
  confidence: number;
  recommendedStake: number;
  prediction: number;
  factors: string[];
  timestamp: number;
  context: BettingContext;
}

export interface PerformanceMetrics {
  clvAverage: number;
  edgeRetention: number;
  kellyMultiplier: number;
  marketEfficiencyScore: number;
  profitByStrategy: Record<string, number>;
  variance: number;
  sharpeRatio: number;
  averageClv: number;
  sharpnessScore: number;
  totalBets: number;
  winRate: number;
  roi: number;
}

export type Sport = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'SOCCER';
export type PropType = 'POINTS' | 'REBOUNDS' | 'ASSISTS' | 'GOALS' | 'TOUCHDOWNS';