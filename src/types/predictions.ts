import { Bet, Event } from './index';

export interface PredictionModel {
  id: string;
  name: string;
  type: string;
  version: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  features: string[];
  lastUpdated: string;
}

export interface PredictionInput {
  eventId: string;
  market: string;
  selection: string;
  modelId?: string;
  features?: {
    [key: string]: number | string;
  };
}

export interface PredictionOutput {
  predictionId: string;
  eventId: string;
  market: string;
  selection: string;
  prediction: {
    probability: number;
    confidence: number;
    edge: number;
    recommendedStake: number;
    kellyFraction: number;
  };
  riskAnalysis: {
    variance: number;
    correlation: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  features: {
    name: string;
    value: number | string;
    importance: number;
  }[];
  timestamp: string;
}

export interface MoneyMakerOpportunity {
  id: string;
  legs: MoneyMakerLeg[];
  confidence: number;
  expectedValue: number;
  riskMetrics: {
    variance: number;
    correlation: number;
    kellyStake: number;
  };
  createdAt: string;
}

export interface MoneyMakerLeg {
  eventId: string;
  market: string;
  selection: string;
  odds: number;
  prediction: PredictionOutput;
}

export interface LineupBuilderStrategy {
  name: string;
  description: string;
  constraints: {
    minConfidence: number;
    maxRisk: number;
    targetEdge: number;
    maxLegs: number;
    minLegs: number;
    sports?: string[];
    markets?: string[];
  };
  weights: {
    confidence: number;
    edge: number;
    risk: number;
    correlation: number;
  };
}

export interface LineupBuilderOutput {
  id: string;
  strategy: LineupBuilderStrategy;
  legs: MoneyMakerLeg[];
  metrics: {
    confidence: number;
    expectedValue: number;
    risk: number;
    correlation: number;
  };
  createdAt: string;
}

// Supporting types
interface WeatherData {
  temperature: number;
  conditions: string;
  windSpeed: number;
  precipitation: number;
}

interface InjuryData {
  playerId: string;
  status: string;
  impact: number;
  lastUpdated: string;
}

interface GameStats {
  gameId: string;
  date: string;
  stats: Record<string, number>;
}

interface SeasonStats {
  games: number;
  stats: Record<string, number>;
  trends: Record<string, number>;
}

interface MatchupStats {
  headToHead: Record<string, number>;
  styleAdvantage: number;
  coachingMatchup: number;
}

interface ExpertPick {
  source: string;
  prediction: number;
  confidence: number;
  reasoning: string;
} 