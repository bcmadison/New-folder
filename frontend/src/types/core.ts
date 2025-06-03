import { 

  Sport, 
  PropType, 
  AlertType, 
  AlertSeverity, 
  EntryStatus, 
  LineupType,
  AlertMetadata 
} from './common';

// Core Types
export interface TimestampedData {
  id?: string;
  timestamp: number;
  value?: number;
  predicted?: number;
  data?: any;
  metadata?: Record<string, any>;
  type?: string;
  source?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: number;
  metadata: Record<string, any>;
  read: boolean;
  acknowledged: boolean;
}

export interface PerformanceMetrics {
  totalBets: number;
  winRate: number;
  roi: number;
  profitLoss: number;
  clvAverage: number;
  edgeRetention: number;
  kellyMultiplier: number;
  marketEfficiencyScore: number;
  averageOdds: number;
  maxDrawdown: number;
  sharpeRatio: number;
  betterThanExpected: number;
}

export interface ModelMetrics {
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  predictions: number;
  hits?: number;
  misses?: number;
  roi?: number;
  successRate?: number[];
  dates?: string[];
}

export interface MLInsight {
  factor: string;
  impact: number;
  confidence: number;
  description: string;
}

export interface OddsUpdate {
  id: string;
  propId: string;
  bookId: string;
  bookName: string;
  odds: number;
  maxStake: number;
  timestamp: number;
  oldOdds?: number;
  newOdds?: number;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  preferences: Preferences;
  roles: string[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
  title?: string;
}

export interface WSMessage {
  type: string;
  data: string | number | boolean | object;
  timestamp: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxRetries: number;
}

export interface SystemConfig {
  features: string[];
  maxConcurrentRequests: number;
  cacheTimeout: number;
  strategy: string;
  performanceMonitoring?: {
    enabled: boolean;
    sampleRate: number;
    retentionPeriod: number;
  };
  errorHandling?: {
    maxRetries: number;
    backoffFactor: number;
    timeoutMs: number;
  };
  eventBus?: {
    maxListeners: number;
    eventTTL: number;
  };
  emergencyMode?: boolean;
  emergencyThresholds: {
    errorRate: number;
    latencyMs: number;
    memoryUsage: number;
  };
}

export interface PlayerProp {
  id: string;
  player: {
    id: string;
    name: string;
    team: {
      id: string;
      name: string;
      sport: Sport;
    };
  };
  type: PropType;
  line: number;
  odds: number;
  confidence: number;
  timestamp: number;
}

export interface Entry {
  id: string;
  userId: string;
  status: EntryStatus;
  type: LineupType;
  props: PlayerProp[];
  stake: number;
  potentialPayout: number;
  createdAt: string;
  updatedAt: string;
}

export interface Opportunity {
  id: string;
  playerId: string;
  metric: string;
  currentOdds: number;
  predictedOdds: number;
  confidence: number;
  timestamp: number;
  expiryTime: number;
  correlationFactors: string[];
}

export interface MarketState {
  line: number;
  volume: number;
  movement: 'up' | 'down' | 'stable';
}

export interface MarketUpdate {
  id?: string;
  type?: string;
  timestamp: number;
  data: {
    playerId: string;
    metric: string;
    value: number;
    volume?: number;
    movement?: 'up' | 'down' | 'stable';
  };
  metadata?: Record<string, any>;
}

export interface MetricData {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export type MetricType = 'POINTS' | 'REBOUNDS' | 'ASSISTS' | 'TOUCHDOWNS' | 'RUSHING_YARDS' | 'PASSING_YARDS';

export interface AnalysisResult {
  id: string;
  timestamp: number;
  confidence: number;
  risk_factors: string[];
  data: {
    historicalTrends: Array<{ trend: string; strength: number }>;
    marketSignals: Array<{ signal: string; strength: number }>;
  };
}

export interface ComponentMetrics {
  component: string;
  timestamp: number;
  value?: number;
  errorRate?: number;
  throughput?: number;
  resourceUsage?: {
    cpu: number;
    memory: number;
    network: number;
  };
  riskMitigation?: {
    riskLevel: string;
    mitigationStatus: string;
  };
}

export interface ModelState {
  hits: number;
  misses: number;
  accuracy: number;
  lastUpdated: number;
}

export interface PredictionState {
  id: string;
  type: string;
  weight: number;
  confidence: number;
  lastUpdate: number;
  metadata: {
    predictions: number;
    accuracy: number;
    calibration: number;
  };
}

export interface State {
  data: {
    activeStreams: Map<string, { metrics: { errorCount: number } }>;
  };
}

export interface Preferences {
  defaultStake: number;
  riskTolerance: 'low' | 'medium' | 'high';
  favoriteLeagues: Sport[];
  notifications: {
    email: boolean;
    push: boolean;
    arbitrage: boolean;
    valueProps: boolean;
  };
  darkMode: boolean;
  defaultSport: Sport;
}

export interface HistoricalTrend {
  trend: string;
  strength: number;
}

export interface MarketSignal {
  signal: string;
  strength: number;
}

export interface Analysis {
  historicalTrends: Array<HistoricalTrend>;
  marketSignals: Array<MarketSignal>;
  riskFactors: string[];
  volatility?: number;
  marketVolatility?: number;
  correlationFactors?: string[];
}

export interface BettingOpportunity {
  id: string;
  propId: string;
  type: 'OVER' | 'UNDER';
  confidence: number;
  expectedValue: number;
  timestamp: number;
  marketState: MarketState;
  analysis: Analysis;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  opponent: string;
  gameTime: string;
  sport: Sport;
  fireCount?: string;
  winningProp?: {
    stat: string;
    line: number;
    type: PropType;
    percentage: number;
  };
  whyThisBet?: string;
}

interface StrategyPerformance {
  totalExecutions: number;
  successRate: number;
  averageReturn: number;
  riskProfile: {
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
  lastUpdated: number;
}

interface CompositeStrategy {
  id: string;
  name: string;
  strategies: string[];
  weights: number[];
  performance: StrategyPerformance;
  conditions: {
    minConfidence: number;
    maxRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    marketStates: string[];
  };
}

export type RiskTolerance = 'low' | 'medium' | 'high';
export enum RiskToleranceEnum {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export type BetType = 'single' | 'parlay' | 'teaser' | 'prop';
export type BetResult = 'win' | 'loss' | 'push' | 'pending';

export interface BetRecord {
  id: string;
  playerId: string;
  metric: string;
  stake: number;
  odds: number;
  result: 'WIN' | 'LOSS' | 'PUSH' | 'PENDING';
  profitLoss: number;
  timestamp: number;
  closingOdds?: number;
}

export interface ClvAnalysis {
  clvValue: number;
  edgeRetention: number;
  marketEfficiency: number;
}

export interface BettingDecision {
  id: string;
  type: BetType;
  stake: number;
  odds: number;
  confidence: number;
  shouldBet: boolean;
  metadata: {
    strategy: string;
    factors: string[];
    riskScore: number;
    propId?: string;
    playerId?: string;
  };
}

export interface BettingContext {
  bankroll: number;
  maxRiskPerBet: number;
  minOdds: number;
  maxOdds: number;
  odds: number;
  metrics: PerformanceMetrics;
  recentBets: BetRecord[];
  timestamp: number;
}

export interface Projection {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  opponent: string;
  sport: Sport;
  league: string;
  propType: PropType;
  line: number;
  overOdds: number;
  underOdds: number;
  timestamp: number;
  gameTime: string;
  status: 'active' | 'suspended' | 'settled';
  result?: number;
}

export interface PredictionUpdate {
  propId: string;
  prediction: {
    value: number;
    confidence: number;
    factors: string[];
  };
  timestamp: number;
}

export interface PredictionContext {
  playerId: string;
  metric: string;
  timestamp: number;
  marketState: MarketState;
  prediction?: PredictionUpdate;
  historicalData?: TimestampedData[];
}

export interface DataPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

// Event map for type-safe event handling
export interface EventMap {
  'bettingDecision': BettingDecision;
  'alert': Alert;
  'oddsUpdate': OddsUpdate;
  'error': Error;
  'trace:completed': {
    id: string;
    name: string;
    duration: number;
    error?: string;
    metadata?: Record<string, any>;
  };
  'metric:recorded': {
    name: string;
    value: number;
    timestamp: number;
    labels?: Record<string, string>;
    tags?: Record<string, string>;
  };
  'config:updated': {
    section: string;
    timestamp: number;
    config?: any;
    values?: Record<string, any>;
  };
  'monitor:alert': {
    id: string;
    severity: AlertSeverity;
    message: string;
    timestamp: number;
    component: string;
    context: Record<string, any>;
    acknowledged: boolean;
  };
  'betting:result': {
    betId: string;
    result: BetResult;
    timestamp: number;
    metadata?: Record<string, any>;
  };
  'strategy:update': {
    strategyId: string;
    status: string;
    timestamp: number;
    metadata?: Record<string, any>;
  };
  'config:initialized': { timestamp: number; status: string };
  'config:loaded': { timestamp: number; status: string };
  'feature:update': FeatureFlag;
  'feature:updated': { featureId: string; timestamp: number };
  'experiment:update': ExperimentConfig;
  'experiment:updated': { experimentId: string; timestamp: number };
  'market:update': MarketUpdate;
  'prediction:update': BettingOpportunity;
  'data:updated': { 
    data: TimestampedData[] | Record<string, any>;
    sourceId?: string;
    timestamp: number 
  };
  'dataSource:registered': { sourceId: string; name: string; timestamp: number };
  'dataSource:error': { sourceId: string; error: Error; timestamp: number };
  'monitor:alert:acknowledged': { alertId: string; timestamp: number };
  'risk:profile:created': { profileId: string };
  'risk:profile:updated': { profileId: string };
  'risk:profile:deleted': { profileId: string };
  'risk:violation': {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    metadata: Record<string, any>;
  };
  'risk:rule:added': { profileId: string; ruleId: string };
  'risk:rule:updated': { profileId: string; ruleId: string };
  'risk:rule:deleted': { profileId: string; ruleId: string };
  'risk:rule:executed': { profileId: string; ruleId: string; context: Record<string, any> };
  'analytics:flushed': { count: number; timestamp: number };
  'analytics:config:updated': { config: Record<string, any>; timestamp: number };
  'analytics:cleanup': { timestamp: number };
  'cache:set': { key: string; timestamp: number; size: number; ttl: number };
  'cache:hit': { key: string; timestamp: number; hits: number };
  'cache:delete': { key: string; timestamp: number };
  'cache:clear': { source?: string; timestamp?: number };
  'cache:evict': { key: string; timestamp: number; reason: string };
  'cache:cleanup': { expiredCount: number; timestamp: number };
  'cache:config:updated': { config: Record<string, any>; timestamp: number };
  'cache:shutdown': { timestamp: number };
  'strategy:recommendation': BettingOpportunity;
  'strategy:opportunities': DataPoint[];
  'data-integration-completed': { timestamp: number; metrics: Record<string, any> };
  'data-source-metric-updated': { sourceId: string; latency: number; reliability: number; accuracy: number; lastSync: number };
  'data:integrated': { integratedData: Record<string, any>; timestamp: number };
  'cache:cleared': { source: string };
  'config:update': ConfigUpdate;
}

export type EventTypes = keyof EventMap;

export interface StreamState {
  id: string;
  type: string;
  source: string;
  isActive: boolean;
  lastUpdate: number;
  metrics: {
    throughput: number;
    latency: number;
    errorCount: number;
  };
}

export interface DataStream<T = TimestampedData> {
  id: string;
  type: string;
  source: string;
  isActive: boolean;
  lastUpdate: number;
  confidence: number;
  metrics: {
    throughput: number;
    latency: number;
    errorCount: number;
  };
  getLatestData(): T | undefined;
  subscribe(callback: (data: T) => void): () => void;
  unsubscribe(callback: (data: T) => void): void;
}

export interface DataState {
  activeStreams: Map<string, DataStream<TimestampedData>>;
  lastUpdate: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: Error;
}

export interface AppConfig {
  system: {
    environment: string;
    logLevel: string;
    debug: boolean;
  };
  apis: {
    prizePicks?: {
      baseUrl: string;
      apiKey: string;
    };
    espn: {
      baseUrl: string;
      apiKey: string;
    };
    socialSentiment: {
      baseUrl: string;
      apiKey: string;
    };
  };
  features: {
    [key: string]: boolean;
  };
  experiments: {
    [key: string]: {
      enabled: boolean;
      variants: string[];
      distribution: number[];
    };
  };
}

export interface ConfigUpdate {
  section: string;
  values: Record<string, any>;
  timestamp?: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  lastUpdated?: number;
}

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  variants: string[];
  distribution: Record<string, number>;
  startDate: number;
  endDate: number;
  status: 'active' | 'inactive' | 'completed';
  lastUpdated?: number;
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  priority: number;
}

export interface ThresholdConfig {
  id: string;
  maxStakePerBet?: number;
  maxDailyLoss?: number;
  maxExposurePerStrategy?: number;
  maxLoadTime?: number;
  maxResponseTime?: number;
  minCacheHitRate?: number;
  updateInterval: number;
}

export interface StrategyConfig {
  riskTolerance?: number;
  minConfidence?: number;
  maxExposure?: number;
  hedgingEnabled?: boolean;
  adaptiveStaking?: boolean;
  profitTarget: number;
  stopLoss: number;
  confidenceThreshold?: number;
  kellyFraction?: number;
  initialBankroll?: number;
  minStake?: number;
  maxStakeLimit?: number;
  maxExposureLimit?: number;
  riskToleranceLevel?: number;
  hedgingThreshold?: number;
  updateInterval: number;
  id?: string;
}

export interface RiskAssessment {
  riskLevel: number;
  maxExposure: number;
  confidenceScore: number;
  volatilityScore: number;
  correlationFactors: string[];
}

export interface StrategyRecommendation {
  id: string;
  type?: 'OVER' | 'UNDER';
  confidence: number;
  timestamp: number;
  parameters?: {
    stake: number;
    expectedValue: number;
  };
  status?: 'active' | 'closed' | 'pending';
  lastUpdate?: number;
  strategyId?: string;
  recommendedStake?: number;
  entryPoints?: number[];
  exitPoints?: number[];
  hedgingRecommendations?: string[];
  opportunityId?: string;
  riskAssessment?: RiskAssessment;
  metadata?: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
}

export interface BettingStrategy {
  id: string;
  opportunityId: string;
  riskAssessment: RiskAssessment;
  recommendedStake: number;
  entryPoints: number[];
  exitPoints: number[];
  hedgingRecommendations: string[];
  timestamp: number;
  status: 'active' | 'closed' | 'pending';
  metadata: {
    createdAt: number;
    updatedAt: number;
    version: string;
  };
} 