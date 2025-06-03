// src/types/index.ts

// Re-export shared types for unified type safety
export * from '../../shared';
// export * from './betting';
// export * from './prizePicks'; // (now handled by shared)
// export * from './webSocket'; // (now handled by shared)
// export * from '../adapters/poe/types'; // Only if needed, otherwise remove

// General Application Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  defaultStake: number;
  favoriteSports: string[];
  notifications: {
    email: boolean;
    push: boolean;
    betUpdates: boolean;
    oddsChanges: boolean;
  };
}

export interface Bet {
  id: string;
  eventId: string;
  market: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWinnings: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  result?: {
    amount: number;
    timestamp: string;
  };
  timestamp: string;
}

export interface BetAnalysis {
  historicalPerformance: number;
  currentForm: number;
  matchupAdvantage: number;
  valueRating: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidenceFactors: string[];
}

export interface Event {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  markets: Market[];
  timestamp: string;
}

export interface Market {
  name: string;
  selections: Selection[];
}

export interface Selection {
  name: string;
  odds: number;
  probability: number;
}

export interface Prediction {
  id: string;
  market: string;
  selection: string;
  probability: number;
  confidence: number;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  name: string;
  value: number;
  weight: number;
}

// Unified Configuration Types (as expected by UnifiedConfig.ts)
export interface FeatureFlags { 
  [key: string]: boolean; 
  // Example specific flags (can be defined as needed by the app)
  newDashboardLayout: boolean;
  advancedAnalytics: boolean;
  realtimePriceUpdates: boolean;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Array<{ id: string; name: string; weight: number }>;
  isActive: boolean;
  // allocation: number[]; // If using simple array allocation
}

export interface ApiEndpoints { 
  [serviceName: string]: string; 
  // Examples (made non-optional for index signature compatibility):
  users: string;
  prizepicks: string;
  predictions: string;
  dataScraping: string;
  config: string;
  // ... other microservices or backend modules
}

export interface BettingLimits {
  maxStakeSingle: number;
  maxStakeParlay: number;
  maxPayout: number;
  minLegsParlay?: number;
  maxLegsParlay?: number;
}

export interface NotificationPreferences {
  email: {
    betUpdates: boolean;
    promotions: boolean;
    newsletters: boolean;
  };
  push: {
    liveScoreUpdates: boolean;
    betResults: boolean;
  };
  inApp?: {
      importantAlerts: boolean;
  }
}

export interface DataProviderConfig {
  providerName: string;
  apiKeyRequired?: boolean;
  rateLimit?: number; // requests per minute, for example
  // ... other provider-specific settings
}

// Social Sentiment & News
export interface SocialSentimentData {
  topic: string; // Player name, team, prop ID, etc.
  sentimentScore: number; // e.g., -1 (very negative) to 1 (very positive)
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  source: string; // e.g., 'Twitter', 'Reddit', 'Combined'
  lastUpdatedAt: string; // ISO date string
}

export interface ESPNHeadline {
  id: string;
  title: string;
  summary: string;
  link: string;
  publishedAt: string; // ISO date string
  source: string; // e.g., 'ESPN'
  imageUrl?: string;
  category?: string;
}

// Data & Predictions
export interface DailyFantasyProjection {
  playerId: string;
  playerName: string;
  team: string;
  opponent?: string;
  projection: number;
  statType: string; // e.g., 'points', 'rebounds'
  salary?: number;
  source: string; // e.g., 'DailyFantasyPros', 'RotoWire'
  lastUpdatedAt: string;
}

export interface OddsData {
  propId: string;
  sportsbook: string;
  overOdds?: number;
  underOdds?: number;
  lastUpdatedAt: string;
}

// For ML Predictions
export interface PredictionInput {
  propId: string;
  // relevant features for the model
  historicalStats?: any;
  marketOdds?: any;
  // ... other features
}

export interface PredictionOutput {
  propId: string;
  predictedOutcome: 'over' | 'under' | string; // Could be more complex for other bet types
  confidence: number; // 0 to 1
  modelUsed: string;
  // ... other prediction details
}

export interface PredictionUpdate {
    id: string;
    timestamp: string;
    status: 'pending' | 'completed' | 'failed';
    result?: any;
    error?: string;
}

// Strategy & Betting
export interface StrategyRecommendation {
  strategyId: string;
  description: string;
  confidence: number; // Overall confidence in the strategy
  expectedValue?: number;
  riskLevel: 'low' | 'medium' | 'high';
  bets: BetDetails[]; // Array of bets that make up this strategy
}

export interface BetDetails { // Part of StrategyRecommendation, or for placing bets
  propId: string;
  type: 'OVER' | 'UNDER'; // Standardized to uppercase from some services, map to lowercase for ParlayLeg
  line?: number; // This might be redundant if propId implies it, but useful for display
  odds: number;
  stakeSuggestion?: number;
  expectedValue?: number;
}

// UI Specific Types
export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // in ms
}

// Generic API response structure if needed
export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

// Add any other shared types required by the application

// Unified Engine Types (as per guide, placeholders if not fully defined)
export interface MarketUpdate {
  source: string;
  data: any; // Specific structure depends on the source
  timestamp: Date;
}

export interface RawData {
    id: string; // Unique ID for the raw data point
    source: string; // e.g., 'prizepicks', 'espn', 'twitter'
    type: string; // e.g., 'prop_line', 'news_article', 'tweet'
    timestamp: string | Date;
    payload: any; // The actual raw data
    metadata?: Record<string, any>; // Any additional metadata
}
  
export interface NormalizedData {
    id: string; // Globally unique ID, maybe source_originalId
    source: string;
    type: string; // Standardized type e.g., 'player_prop_points', 'game_odds_moneyline'
    timestamp: Date;
    entityId?: string; // e.g., player ID, game ID
    entityName?: string;
    value: number | string | boolean; // Normalized value
    line?: number;
    odds?: number;
    sentiment?: number;
    url?: string;
    metadata?: Record<string, any>; // Standardized metadata fields
}
  
export interface AggregatedDataPoint {
    metricId: string; // e.g., 'player_sentiment_avg_1h_lebron', 'game_odds_trend_game123'
    timestamp: Date;
    value: number | string | Record<string, any>;
    window?: string; // e.g., '1h', '24h', '7d'
    dimensions?: Record<string, string>; // e.g., { playerId: 'lebron', market: 'points' }
}
  
export interface DataUpdate {
    source: string;
    timestamp: Date;
    updatedNormalizedIds?: string[];
    updatedAggregatedMetricIds?: string[];
    rawPayload?: RawData[]; // Optional: include raw data that triggered update
}

// Add other types as needed from FULL_PROJECT_GUIDE.txt 

export interface UnifiedMonitor {
    startTrace(name: string, type: string): {
        name: string;
        type: string;
        startTime: number;
        setHttpStatus: (status: number) => void;
    };
    endTrace(trace: any): void;
    reportError(error: any, context: any): void;
}

export interface AppError extends Error {
    context?: any;
    originalError?: any;
}

export interface APIError extends Error {
    status?: number;
    response?: any;
}

export interface Analytics {
  userId: string;
  totalBets: number;
  winningBets: number;
  losingBets: number;
  winRate: number;
  profitLoss: number;
  roi: number;
  averageOdds: number;
  averageStake: number;
  bestStreak: number;
  worstStreak: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'winning' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference?: string;
  metadata?: {
    [key: string]: any;
  };
  createdAt: string;
}

export interface ArbitrageOpportunity {
  id: string;
  eventId: string;
  market: string;
  selections: {
    name: string;
    odds: number;
    bookmaker: string;
    stake: number;
  }[];
  totalStake: number;
  guaranteedProfit: number;
  roi: number;
  confidence: number;
  expiryTime: string;
  status: 'active' | 'expired' | 'executed';
}

// Export all types
export * from './predictions';
export * from './lineup'; 