import { EventBus } from './EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';
import { UnifiedDataEngine } from './UnifiedDataEngine';
import { UnifiedPredictionEngine } from './UnifiedPredictionEngine';
import { UnifiedStrategyEngine, BettingOpportunity, RiskAssessment } from './UnifiedStrategyEngine';
import { UnifiedConfigManager } from './UnifiedConfig';
import { UnifiedStateManager } from './UnifiedState';
import { UnifiedMonitor } from './UnifiedMonitor';
import { 
  Alert, 
  PerformanceMetrics,
  MarketUpdate,
  TimestampedData,
  StrategyRecommendation,
  AnalysisResult,
  RiskTolerance,
  RiskToleranceEnum,
  BettingContext,
  BettingDecision,
  BetRecord,
  ClvAnalysis,
  StrategyConfig,
  BetType,
  BetResult,
  PredictionContext
} from '../types/core';
import { UnifiedErrorHandler } from './UnifiedError';
import { AnalysisRegistry } from './AnalysisFramework';

interface BettingStrategy {
  id: string;
  name: string;
  description: string;
  evaluate(
    prediction: AnalysisResult,
    context: BettingContext
  ): Promise<BettingDecision>;
  metadata: {
    riskLevel: 'low' | 'medium' | 'high';
    minConfidence: number;
    maxStake: number;
    tags: string[];
  };
}

export interface BankrollConfig {
  initialBalance: number;
  maxRiskPerBet: number;
  maxExposure: number;
  stopLoss: number;
  takeProfit: number;
  kellyMultiplier: number;
}

export interface BankrollState {
  currentBalance: number;
  totalProfit: number;
  totalBets: number;
  winningBets: number;
  losingBets: number;
  currentExposure: number;
  roi: number;
}

export interface BetTransaction {
  id: string;
  timestamp: number;
  type: 'bet' | 'win' | 'loss' | 'deposit' | 'withdrawal';
  amount: number;
  balance: number;
  metadata?: Record<string, any>;
}

export interface ActiveBet {
  id: string;
  opportunity: BettingOpportunity;
  stake: number;
  placedAt: number;
  status: 'pending' | 'won' | 'lost';
  result?: {
    actualValue: number;
    profit: number;
    settledAt: number;
  };
}

export interface BettingPosition {
  id: string;
  propId: string;
  type: 'OVER' | 'UNDER';
  stake: number;
  entryPrice: number;
  timestamp: number;
  status: 'open' | 'closed' | 'pending';
  pnl?: number;
  closeTimestamp?: number;
  closePrice?: number;
}

export interface BettingMetrics {
  totalBets: number;
  winningBets: number;
  losingBets: number;
  totalStake: number;
  totalPnl: number;
  roi: number;
  winRate: number;
  averageStake: number;
  averagePnl: number;
  lastUpdate: number;
}

export interface RiskProfile {
  maxExposure: number;
  maxPositions: number;
  stopLoss: number;
  profitTarget: number;
  riskPerTrade: number;
  maxDrawdown: number;
}

export class UnifiedBettingSystem {
  private static instance: UnifiedBettingSystem;
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly dataEngine: UnifiedDataEngine;
  private readonly predictionEngine: UnifiedPredictionEngine;
  private readonly strategyEngine: UnifiedStrategyEngine;
  private readonly configManager: UnifiedConfigManager;
  private readonly stateManager: UnifiedStateManager;
  private readonly monitor: UnifiedMonitor;
  private readonly errorHandler: UnifiedErrorHandler;
  private readonly strategyConfig: StrategyConfig;
  private readonly analysisRegistry: AnalysisRegistry;
  private readonly strategies: Map<string, BettingStrategy>;
  private readonly MIN_CONFIDENCE = 0.7;
  private readonly MAX_ACTIVE_BETS = 10;
  private readonly RISK_THRESHOLD = 0.8;
  private bankrollConfig: BankrollConfig;
  private bankrollState: BankrollState;
  private activeBets: Map<string, ActiveBet>;
  private transactions: BetTransaction[];
  private readonly positions: Map<string, BettingPosition>;
  private readonly metrics: BettingMetrics;
  private readonly riskProfile: RiskProfile;
  
  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.dataEngine = UnifiedDataEngine.getInstance();
    this.predictionEngine = UnifiedPredictionEngine.getInstance();
    this.strategyEngine = UnifiedStrategyEngine.getInstance();
    this.configManager = UnifiedConfigManager.getInstance();
    this.stateManager = UnifiedStateManager.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.errorHandler = UnifiedErrorHandler.getInstance();
    this.strategyConfig = {
      riskTolerance: 0.5,
      minConfidence: 0.6,
      maxExposure: 0.1,
      hedgingEnabled: true,
      adaptiveStaking: true,
      profitTarget: 0.2,
      stopLoss: 0.1,
      confidenceThreshold: 0.7,
      kellyFraction: 0.5,
      initialBankroll: 10000,
      minStake: 10,
      maxStake: 1000
    };
    this.analysisRegistry = AnalysisRegistry.getInstance();
    this.strategies = new Map();
    this.activeBets = new Map();
    this.transactions = [];
    this.positions = new Map();
    this.metrics = this.initializeMetrics();
    this.riskProfile = this.initializeRiskProfile();
    
    this.setupEventListeners();
  }

  static getInstance(): UnifiedBettingSystem {
    if (!UnifiedBettingSystem.instance) {
      UnifiedBettingSystem.instance = new UnifiedBettingSystem();
    }
    return UnifiedBettingSystem.instance;
  }

  public async initialize(): Promise<void> {
    try {
      const traceId = this.performanceMonitor.startTrace('betting-system-init');

      // Initialize data engine
      await this.dataEngine.connect();

      // Initialize prediction engine
      await this.predictionEngine.initialize();

      // Initialize strategy engine
      await this.strategyEngine.initialize();

      // Load configuration
      await this.configManager.loadConfig();

      // Initialize state
      await this.stateManager.initialize();

      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.monitor.logError('initialization', error as Error);
      throw error;
    }
  }

  public async analyzeBettingOpportunity(context: BettingContext): Promise<BettingDecision> {
    try {
      // Analyze historical data
      const historicalTrends = await this.analyzeHistoricalTrends(context);

      // Analyze market signals
      const marketSignals = await this.analyzeMarketSignals(context);

      // Analyze risk factors
      const riskFactors = await this.analyzeRiskFactors(context);

      // Calculate confidence and expected value
      const { confidence, expectedValue } = this.calculateMetrics(
        historicalTrends,
        marketSignals,
        riskFactors
      );

      // Calculate optimal stake using Kelly Criterion
      const stake = this.calculateOptimalStake(expectedValue, confidence);

      // Create betting decision
      const decision: BettingDecision = {
        id: `decision_${Date.now()}`,
        propId: context.playerId,
        type: expectedValue > 0 ? 'OVER' : 'UNDER',
        confidence,
        expectedValue,
        stake,
        analysis: {
          historicalTrends,
          marketSignals,
          riskFactors,
          predictionFactors: []
        },
        timestamp: Date.now()
      };

      // Emit decision event
      this.eventBus.emit('bettingDecision', decision);

      return decision;
    } catch (error) {
      this.errorHandler.handleError(error);
      throw error;
    }
  }

  public calculatePerformanceMetrics(bets: BetRecord[]): PerformanceMetrics {
    const completedBets = bets.filter(bet => bet.result !== 'PENDING');
    const wins = completedBets.filter(bet => bet.result === 'WIN');
    
    const totalStake = completedBets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturn = completedBets.reduce((sum, bet) => {
      if (bet.result === 'WIN') {
        return sum + bet.payout;
      }
      return sum - bet.stake;
    }, 0);

    const winRate = wins.length / completedBets.length;
    const roi = totalReturn / totalStake;
    const profitLoss = totalReturn;

    const returns = completedBets.map(bet => 
      bet.result === 'WIN' ? (bet.payout - bet.stake) / bet.stake : -1
    );

    const variance = this.calculateVariance(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const clvAnalysis = this.calculateAverageClv(completedBets);

    return {
      winRate: winRate * 100,
      roi: roi * 100,
      profitLoss,
      totalBets: completedBets.length,
      averageOdds: this.calculateAverageOdds(completedBets),
      maxDrawdown: this.calculateMaxDrawdown(completedBets),
      sharpeRatio,
      betterThanExpected: this.calculateEdgeRetention(completedBets),
      clvAverage: clvAnalysis.clvValue,
      edgeRetention: clvAnalysis.edgeRetained,
      kellyMultiplier: this.calculateKellyMultiplier(roi, winRate),
      marketEfficiencyScore: clvAnalysis.marketEfficiency,
      profitByStrategy: this.calculateProfitByStrategy(completedBets),
      variance,
      sharpnessScore: this.calculateSharpnessScore(completedBets)
    };
  }

  public analyzeClv(bet: BetRecord): ClvAnalysis {
    const clvValue = this.calculateClvValue(bet);
    const edgeRetained = this.calculateEdgeRetention([bet]);
    const marketEfficiency = this.calculateMarketEfficiency(bet);
    const timeValue = this.calculateTimeValue(bet);

    return {
      clvValue,
      edgeRetained,
      marketEfficiency,
      timeValue,
      factors: [
        {
          name: 'Market Timing',
          impact: this.calculateTimingImpact(bet),
          description: 'Impact of bet timing relative to market close'
        },
        {
          name: 'Price Movement',
          impact: this.calculatePriceMovement(bet),
          description: 'Magnitude and direction of line movement'
        },
        {
          name: 'Market Efficiency',
          impact: marketEfficiency,
          description: 'Overall market pricing efficiency'
        }
      ]
    };
  }

  private async analyzeHistoricalTrends(context: BettingContext): Promise<string[]> {
    // Implement historical analysis
    return [];
  }

  private async analyzeMarketSignals(context: BettingContext): Promise<string[]> {
    // Implement market signal analysis
    return [];
  }

  private async analyzeRiskFactors(context: BettingContext): Promise<string[]> {
    // Implement risk factor analysis
    return [];
  }

  private calculateMetrics(
    historicalTrends: string[],
    marketSignals: string[],
    riskFactors: string[]
  ): { confidence: number; expectedValue: number } {
    // Implement metric calculation
    return { confidence: 0.7, expectedValue: 0.05 };
  }

  private calculateOptimalStake(expectedValue: number, confidence: number): number {
    const kellyStake = (expectedValue * confidence) / this.strategyConfig.kellyFraction;
    return Math.min(
      Math.max(kellyStake, this.strategyConfig.minStake),
      this.strategyConfig.maxStake
    );
  }

  private calculateVariance(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    return returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  }

  private calculateSharpeRatio(returns: number[]): number {
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(this.calculateVariance(returns));
    const riskFreeRate = 0.02 / 365; // Daily risk-free rate
    return (mean - riskFreeRate) / stdDev;
  }

  private calculateAverageOdds(bets: BetRecord[]): number {
    return bets.reduce((sum, bet) => sum + bet.odds, 0) / bets.length;
  }

  private calculateMaxDrawdown(bets: BetRecord[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let balance = 0;

    bets.forEach(bet => {
      if (bet.result === 'WIN') {
        balance += bet.payout - bet.stake;
      } else {
        balance -= bet.stake;
      }

      if (balance > peak) {
        peak = balance;
      }

      const drawdown = (peak - balance) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });

    return maxDrawdown * 100;
  }

  private calculateClvValue(bet: BetRecord): number {
    if (!bet.metadata.closingOdds) return 0;
    return ((bet.metadata.closingOdds - bet.odds) / bet.odds) * 100;
  }

  private calculateEdgeRetention(bets: BetRecord[]): number {
    const expectedWinRate = bets.reduce((sum, bet) => sum + bet.metadata.confidence, 0) / bets.length;
    const actualWinRate = bets.filter(bet => bet.result === 'WIN').length / bets.length;
    return (actualWinRate / expectedWinRate) * 100;
  }

  private calculateMarketEfficiency(bet: BetRecord): number {
    if (!bet.metadata.closingOdds) return 1;
    const movement = Math.abs(bet.metadata.closingOdds - bet.odds);
    return 1 - (movement / bet.odds);
  }

  private calculateTimeValue(bet: BetRecord): number {
    if (!bet.metadata.closingLine) return 0;
    const timeToClose = (bet.metadata.closingLine - bet.timestamp) / 3600000; // Hours
    return Math.exp(-timeToClose / 24); // Decay factor
  }

  private calculateTimingImpact(bet: BetRecord): number {
    if (!bet.metadata.closingLine) return 0;
    const timeToClose = (bet.metadata.closingLine - bet.timestamp) / 3600000;
    return 1 - (timeToClose / 24);
  }

  private calculatePriceMovement(bet: BetRecord): number {
    if (!bet.metadata.closingOdds) return 0;
    return (bet.metadata.closingOdds - bet.odds) / bet.odds;
  }

  private calculateKellyMultiplier(roi: number, winRate: number): number {
    return (roi * winRate - (1 - winRate)) / roi;
  }

  private calculateProfitByStrategy(bets: BetRecord[]): Record<string, number> {
    return bets.reduce((acc, bet) => {
      const strategy = bet.metadata.predictionFactors?.[0] || 'unknown';
      const profit = bet.result === 'WIN' ? bet.payout - bet.stake : -bet.stake;
      acc[strategy] = (acc[strategy] || 0) + profit;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateSharpnessScore(bets: BetRecord[]): number {
    const clvScore = this.calculateAverageClv(bets).clvValue;
    const winRate = bets.filter(bet => bet.result === 'WIN').length / bets.length;
    return (clvScore * 0.6 + winRate * 100 * 0.4);
  }

  private calculateAverageClv(bets: BetRecord[]): ClvAnalysis {
    const betsWithClv = bets.filter(bet => bet.metadata.closingOdds);
    if (betsWithClv.length === 0) {
      return {
        clvValue: 0,
        edgeRetained: 0,
        marketEfficiency: 1,
        timeValue: 0,
        factors: []
      };
    }

    const clvValues = betsWithClv.map(bet => this.calculateClvValue(bet));
    const avgClv = clvValues.reduce((sum, clv) => sum + clv, 0) / clvValues.length;

    return {
      clvValue: avgClv,
      edgeRetained: this.calculateEdgeRetention(betsWithClv),
      marketEfficiency: betsWithClv.reduce((sum, bet) => sum + this.calculateMarketEfficiency(bet), 0) / betsWithClv.length,
      timeValue: betsWithClv.reduce((sum, bet) => sum + this.calculateTimeValue(bet), 0) / betsWithClv.length,
      factors: []
    };
  }

  private setupEventListeners(): void {
    // Handle market updates
    this.eventBus.subscribe('market:update', async (event) => {
      try {
        const update = event.payload as unknown as MarketUpdate;
        await this.handleMarketUpdate(update);
      } catch (error) {
        this.monitor.logError('betting', error as Error, { event });
      }
    });

    // Handle prediction feedback
    this.eventBus.subscribe('prediction:feedback', async (event) => {
      try {
        await this.handlePredictionFeedback(event.payload as { actual: number; predicted: number; confidence: number; factors: { name: string; source: string; }[]; });
      } catch (error) {
        this.monitor.logError('betting', error as Error, { event });
      }
    });

    // Handle strategy results
    this.eventBus.subscribe('strategy:result', async (event) => {
      try {
        await this.handleStrategyResult(event.payload as { profitLoss: number; exposure: number; confidence: number; factors: { name: string; source: string; }[]; });
      } catch (error) {
        this.monitor.logError('betting', error as Error, { event });
      }
    });

    // Handle system alerts
    this.eventBus.subscribe('monitor:alert', (event) => {
      const alert = event.payload as unknown as Alert;
      if (alert.severity === 'error') {
        this.handleCriticalAlert(alert);
      }
    });

    this.eventBus.on('metric:recorded', async (data) => {
      if (data.name === 'betting_performance') {
        await this.updatePerformanceMetrics(data.value);
      }
    });

    this.eventBus.on('prediction:update', this.handleOpportunity.bind(this));
  }

  private async handleMarketUpdate(update: MarketUpdate): Promise<void> {
    this.dataEngine.handleMarketUpdate(update);
    this.eventBus.publish({
      type: 'system:market_update',
      payload: { update }
    });
  }

  private async handlePredictionFeedback(feedback: {
    actual: number;
    predicted: number;
    confidence: number;
    factors: Array<{ name: string; source: string }>;
  }): Promise<void> {
    this.eventBus.publish({
      type: 'system:prediction_feedback',
      payload: {
        timestamp: Date.now(),
        feedback
      }
    });

    // Update performance metrics
    const state = this.stateManager.getState();
    if (feedback.actual !== undefined) {
      const performance = state.betting.performance as PerformanceMetrics;
      const isWin = feedback.actual > feedback.predicted;
      
      this.stateManager.updateState({
        betting: {
          activeBets: state.betting.activeBets,
          performance: {
            ...performance,
            totalBets: (performance.totalBets ?? 0) + 1,
            winRate: (((performance.totalBets ?? 0) * (performance.winRate ?? 0) + (isWin ? 1 : 0)) / ((performance.totalBets ?? 0) + 1))
          },
          lastDecision: state.betting.lastDecision
        }
      });
    }
  }

  private async handleStrategyResult(result: {
    profitLoss: number;
    exposure: number;
    confidence: number;
    factors: Array<{ name: string; source: string }>;
  }): Promise<void> {
    this.eventBus.publish({
      type: 'system:strategy_result',
      payload: {
        timestamp: Date.now(),
        result
      }
    });

    // Update risk exposure
    const state = this.stateManager.getState();
    if (result.profitLoss !== undefined) {
      this.stateManager.updateState({
        strategy: {
          activeStrategies: state.strategy.activeStrategies,
          riskExposure: state.strategy.riskExposure + result.exposure,
          profitLoss: state.strategy.profitLoss + result.profitLoss
        }
      });
    }
  }

  private async handleCriticalAlert(alert: Alert): Promise<void> {
    const config = this.configManager.getConfig();
    const state = this.stateManager.getState();

    try {
      // Log critical alert
      this.monitor.logError('betting', new Error(alert.message), {
        alert,
        systemState: state
      });

      // Implement circuit breaker pattern
      if (this.shouldActivateCircuitBreaker(alert)) {
        config.system.emergencyMode = true;
        await this.configManager.updateConfig({ system: config.system });
        
        // Stop all active betting operations
        await this.stopActiveBettingOperations();
        
        // Notify monitoring systems
        await this.eventBus.publish({
          type: 'system:emergency',
          payload: {
            timestamp: Date.now(),
            alert,
            action: 'circuit_breaker_activated'
          }
        });
      }

      // Apply risk mitigation based on alert type
      switch (alert.type) {
        case 'ODDS_CHANGE':
          await this.mitigateOddsRisk(alert);
          break;
        case 'INJURY':
          await this.mitigateInjuryRisk(alert);
          break;
        case 'WEATHER':
          await this.mitigateWeatherRisk(alert);
          break;
        case 'LINE_MOVEMENT':
          await this.mitigateLineMovementRisk(alert);
          break;
        case 'SYSTEM':
          await this.mitigateSystemRisk(alert);
          break;
        default:
          throw new Error(`Unhandled alert type: ${alert.type}`);
      }
    } catch (error) {
      // Log the error but don't rethrow to prevent cascading failures
      this.monitor.logError('betting', error as Error, {
        context: 'handleCriticalAlert',
        alert,
        systemState: state
      });
      
      // Force emergency mode on error
      config.system.emergencyMode = true;
      await this.configManager.updateConfig({ system: config.system });
    }
  }

  private shouldActivateCircuitBreaker(alert: Alert): boolean {
    const config = this.configManager.getConfig();
    const state = this.stateManager.getState();
    // Check system health metrics
    const metrics = this.monitor.getMetrics('betting');
    const errorRate = metrics?.errorRate || 0;
    // Activate circuit breaker if:
    // 1. Error rate exceeds threshold
    // 2. Critical alert in emergency mode
    if (typeof errorRate !== 'number') return false;
    const result = (
      errorRate > config.system.emergencyThresholds.errorRate ||
      (alert.severity === 'critical' && config.system.emergencyMode)
    );
    return !!result;
  }

  private async stopActiveBettingOperations(): Promise<void> {
    const state = this.stateManager.getState();
    
    // Cancel all pending bets
    for (const [betId, bet] of state.betting.activeBets) {
      if (bet.status === 'pending') {
        try {
          await this.cancelBet(betId);
        } catch (error) {
          this.monitor.logError('betting', error as Error, {
            betId,
            operation: 'cancel_bet'
          });
        }
      }
    }
    
    // Stop all active predictions
    this.predictionEngine.stopAllPredictions();
    
    // Reset risk exposure
    this.stateManager.updateState({
      strategy: {
        ...state.strategy,
        riskExposure: 0
      }
    });
  }

  private async cancelBet(betId: string): Promise<void> {
    const state = this.stateManager.getState();
    const bet = state.betting.activeBets.get(betId);
    
    if (!bet) {
      throw new Error(`Bet ${betId} not found`);
    }
    
    // Update bet status
    bet.status = 'cancelled';
    state.betting.activeBets.set(betId, bet);
    
    // Emit bet cancelled event
    this.eventBus.publish({
      type: 'betting:cancelled',
      payload: {
        betId,
        timestamp: Date.now(),
        reason: 'emergency_shutdown'
      }
    });
  }

  private async mitigateOddsRisk(alert: Alert): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Increase confidence threshold
    config.strategy.confidenceThreshold *= 1.2;
    
    // Reduce risk tolerance
    config.strategy.riskTolerance *= 0.8;
    
    // Enable hedging if not already enabled
    config.strategy.hedgingEnabled = true;
    
    this.configManager.updateConfig({ strategy: config.strategy });
    
    // Log mitigation action
    this.monitor.recordMetric('betting', {
      riskMitigation: {
        timestamp: Date.now(),
        changes: {
          confidenceThreshold: config.strategy.confidenceThreshold,
          riskTolerance: config.strategy.riskTolerance,
          hedgingEnabled: config.strategy.hedgingEnabled
        },
        riskLevel: '',
        factors: []
      }
    });
  }

  private async mitigateInjuryRisk(alert: Alert): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Significantly reduce exposure
    config.strategy.maxExposure *= 0.5;
    
    // Increase minimum confidence requirement
    config.strategy.minConfidence *= 1.3;
    
    this.configManager.updateConfig({ strategy: config.strategy });
    
    // Log mitigation action
    this.monitor.recordMetric('betting', {
      riskMitigation: {
        timestamp: Date.now(),
        changes: {
          maxExposure: config.strategy.maxExposure,
          minConfidence: config.strategy.minConfidence
        },
        riskLevel: '',
        factors: []
      }
    });
  }

  private async mitigateWeatherRisk(alert: Alert): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Adjust confidence thresholds
    config.strategy.confidenceThreshold *= 1.25;
    
    // Enable adaptive staking
    config.strategy.adaptiveStaking = true;
    
    this.configManager.updateConfig({ strategy: config.strategy });
    
    // Log mitigation action
    this.monitor.recordMetric('betting', {
      riskMitigation: {
        type: 'weather',
        timestamp: Date.now(),
        changes: {
          confidenceThreshold: config.strategy.confidenceThreshold,
          adaptiveStaking: config.strategy.adaptiveStaking
        },
        riskLevel: '',
        factors: []
      }
    });
  }

  private async mitigateLineMovementRisk(alert: Alert): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Enable adaptive staking
    config.strategy.adaptiveStaking = true;
    
    // Reduce max exposure
    config.strategy.maxExposure *= 0.7;
    
    // Adjust stop loss
    config.strategy.stopLoss *= 0.8;
    
    this.configManager.updateConfig({ strategy: config.strategy });
    
    // Log mitigation action
    this.monitor.recordMetric('betting', {
      riskMitigation: {
        type: 'line_movement',
        timestamp: Date.now(),
        changes: {
          adaptiveStaking: config.strategy.adaptiveStaking,
          maxExposure: config.strategy.maxExposure,
          stopLoss: config.strategy.stopLoss
        },
        riskLevel: '',
        factors: []
      }
    });
  }

  private async mitigateSystemRisk(alert: Alert): Promise<void> {
    const config = this.configManager.getConfig();
    
    // Enable emergency mode
    config.system.emergencyMode = true;
    
    // Drastically reduce risk
    config.strategy.riskTolerance *= 0.3;
    config.strategy.maxExposure *= 0.3;
    config.strategy.stopLoss *= 0.5;
    
    // Enable all safety features
    config.strategy.hedgingEnabled = true;
    config.strategy.adaptiveStaking = true;
    
    this.configManager.updateConfig({
      system: config.system,
      strategy: config.strategy
    });
    
    // Log mitigation action
    this.monitor.recordMetric('betting', {
      riskMitigation: {
        type: 'system',
        timestamp: Date.now(),
        changes: {
          emergencyMode: config.system.emergencyMode,
          riskTolerance: config.strategy.riskTolerance,
          maxExposure: config.strategy.maxExposure,
          stopLoss: config.strategy.stopLoss,
          hedgingEnabled: config.strategy.hedgingEnabled,
          adaptiveStaking: config.strategy.adaptiveStaking
        },
        riskLevel: '',
        factors: []
      }
    });
  }

  public registerStrategy(strategy: BettingStrategy): void {
    if (this.strategies.has(strategy.id)) {
      throw new Error(`Strategy ${strategy.id} already registered`);
    }

    this.strategies.set(strategy.id, strategy);

    // Emit strategy registered event
    this.eventBus.emit('metric:recorded', {
      name: 'strategy_registered',
      value: 1,
      timestamp: Date.now(),
      labels: {
        strategy_id: strategy.id,
        strategy_name: strategy.name,
        risk_level: strategy.metadata.riskLevel
      }
    });
  }

  public async evaluateBet(
    prediction: AnalysisResult,
    odds: number,
    context?: Partial<BettingContext>
  ): Promise<BettingDecision> {
    const state = this.stateManager.getState();
    const bettingContext = this.createBettingContext(odds, context);

    // Check system constraints
    if (!this.validateSystemConstraints(state, bettingContext)) {
      return this.createNoBetDecision('system_constraints');
    }

    // Get applicable strategies
    const applicableStrategies = this.getApplicableStrategies(prediction, bettingContext);
    if (applicableStrategies.length === 0) {
      return this.createNoBetDecision('no_applicable_strategies');
    }

    // Evaluate strategies
    const decisions = await Promise.all(
      applicableStrategies.map(strategy =>
        strategy.evaluate(prediction, bettingContext)
      )
    );

    // Aggregate decisions
    const aggregatedDecision = this.aggregateDecisions(decisions, prediction);

    // Update state if we should bet
    if (aggregatedDecision.shouldBet) {
      const betRecord: BetRecord = {
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: aggregatedDecision.type,
        stake: aggregatedDecision.stake,
        odds,
        timestamp: Date.now(),
        metadata: {
          predictionId: prediction.id,
          confidence: aggregatedDecision.confidence,
          strategy: aggregatedDecision.metadata.strategy,
          factors: aggregatedDecision.metadata.factors
        }
      };

      this.stateManager.updateBettingState({
        activeBets: new Map(state.betting.activeBets).set(betRecord.id, betRecord)
      });

      // Emit bet placed event
      this.eventBus.emit('metric:recorded', {
        name: 'bet_placed',
        value: betRecord.stake,
        timestamp: Date.now(),
        labels: {
          bet_id: betRecord.id,
          type: betRecord.type,
          odds: String(odds),
          confidence: String(aggregatedDecision.confidence)
        }
      });
    }

    return aggregatedDecision;
  }

  public async settleBet(betId: string, result: BetResult): Promise<void> {
    const state = this.stateManager.getState();
    const bet = state.betting.activeBets.get(betId);
    if (!bet) {
      throw new Error(`Bet ${betId} not found`);
    }

    // Calculate payout
    const payout = this.calculatePayout(bet, result);

    // Update bet record
    const updatedBet: BetRecord = {
      ...bet,
      result,
      metadata: {
        ...bet.metadata,
        payout,
        settledAt: Date.now()
      }
    };

    // Update state
    const activeBets = new Map(state.betting.activeBets);
    activeBets.delete(betId);

    this.stateManager.updateBettingState({
      activeBets,
      performance: this.updatePerformanceMetrics(payout)
    });

    // Emit bet settled event
    this.eventBus.emit('betting:result', {
      betId,
      result,
      timestamp: Date.now(),
      metadata: {
        payout,
        type: bet.type,
        stake: bet.stake,
        odds: bet.odds
      }
    });
  }

  private createBettingContext(
    odds: number,
    context?: Partial<BettingContext>
  ): BettingContext {
    const state = this.stateManager.getState();
    const defaultContext: BettingContext = {
      bankroll: 10000, // Default bankroll
      maxRiskPerBet: 0.02, // 2% of bankroll
      minOdds: 1.5,
      maxOdds: 10,
      metrics: state.betting.performance || {
        totalBets: 0,
        winRate: 0,
        roi: 0,
        profitLoss: 0,
        clvAverage: 0,
        edgeRetention: 0,
        kellyMultiplier: 1,
        marketEfficiencyScore: 0,
        averageOdds: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        betterThanExpected: 0
      },
      recentBets: Array.from(state.betting.activeBets.values()),
      timestamp: Date.now()
    };

    return { ...defaultContext, ...context };
  }

  private validateSystemConstraints(
    state: any,
    context: BettingContext
  ): boolean {
    // Check number of active bets
    if (state.betting.activeBets.size >= this.MAX_ACTIVE_BETS) {
      return false;
    }

    // Check odds range
    if (
      context.odds < context.minOdds ||
      context.odds > context.maxOdds
    ) {
      return false;
    }

    // Check system status
    if (state.status !== 'ready') {
      return false;
    }

    return true;
  }

  private getApplicableStrategies(
    prediction: AnalysisResult,
    context: BettingContext
  ): BettingStrategy[] {
    return Array.from(this.strategies.values()).filter(strategy => {
      // Check confidence threshold
      if (prediction.confidence < strategy.metadata.minConfidence) {
        return false;
      }

      // Check risk level
      const riskScore = this.calculateRiskScore(prediction, context);
      if (
        (strategy.metadata.riskLevel === 'low' && riskScore > 0.3) ||
        (strategy.metadata.riskLevel === 'medium' && riskScore > 0.6) ||
        (strategy.metadata.riskLevel === 'high' && riskScore > this.RISK_THRESHOLD)
      ) {
        return false;
      }

      return true;
    });
  }

  private aggregateDecisions(
    decisions: BettingDecision[],
    prediction: AnalysisResult
  ): BettingDecision {
    const positiveBets = decisions.filter(d => d.shouldBet);
    if (positiveBets.length === 0) {
      return this.createNoBetDecision('no_positive_decisions');
    }

    // Calculate weighted stake and confidence
    const totalConfidence = positiveBets.reduce((sum, d) => sum + d.confidence, 0);
    const weightedStake =
      positiveBets.reduce((sum, d) => sum + d.stake * (d.confidence / totalConfidence), 0);
    const averageConfidence = totalConfidence / positiveBets.length;

    // Combine factors and calculate risk
    const allFactors = Array.from(
      new Set(positiveBets.flatMap(d => d.metadata.factors))
    );
    const averageRisk =
      positiveBets.reduce((sum, d) => sum + d.metadata.riskScore, 0) /
      positiveBets.length;

    return {
      shouldBet: true,
      stake: Math.min(
        weightedStake,
        prediction.metadata.models[0]?.weight || 0 * context.maxRiskPerBet * context.bankroll
      ),
      confidence: averageConfidence,
      type: this.determineBetType(positiveBets),
      metadata: {
        strategy: positiveBets.map(d => d.metadata.strategy).join(','),
        factors: allFactors,
        riskScore: averageRisk
      }
    };
  }

  private createNoBetDecision(reason: string): BettingDecision {
    return {
      shouldBet: false,
      stake: 0,
      confidence: 0,
      type: 'single',
      metadata: {
        strategy: 'none',
        factors: [reason],
        riskScore: 0
      }
    };
  }

  private calculateRiskScore(
    prediction: AnalysisResult,
    context: BettingContext
  ): number {
    const weights = {
      confidence: 0.3,
      recentPerformance: 0.2,
      marketEfficiency: 0.2,
      exposure: 0.3
    };

    const confidenceRisk = 1 - prediction.confidence;
    const recentPerformanceRisk = 1 - (context.metrics.winRate || 0);
    const marketEfficiencyRisk = 1 - (context.metrics.marketEfficiencyScore || 0);
    const exposureRisk = this.calculateExposureRisk(context);

    return (
      confidenceRisk * weights.confidence +
      recentPerformanceRisk * weights.recentPerformance +
      marketEfficiencyRisk * weights.marketEfficiency +
      exposureRisk * weights.exposure
    );
  }

  private calculateExposureRisk(context: BettingContext): number {
    const totalExposure = context.recentBets.reduce(
      (sum, bet) => sum + bet.stake,
      0
    );
    return Math.min(1, totalExposure / (context.bankroll * context.maxRiskPerBet));
  }

  private determineBetType(decisions: BettingDecision[]): BetType {
    const types = decisions.map(d => d.type);
    return types.includes('parlay') ? 'parlay' : 'single';
  }

  private calculatePayout(bet: BetRecord, result: BetResult): number {
    if (result === 'win') {
      return bet.stake * bet.odds;
    }
    if (result === 'push') {
      return bet.stake;
    }
    return 0;
  }

  private updatePerformanceMetrics(payout: number): PerformanceMetrics {
    const state = this.stateManager.getState();
    const currentMetrics = state.betting.performance || {
      totalBets: 0,
      winRate: 0,
      roi: 0,
      profitLoss: 0,
      clvAverage: 0,
      edgeRetention: 0,
      kellyMultiplier: 1,
      marketEfficiencyScore: 0,
      averageOdds: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      betterThanExpected: 0
    };

    const totalBets = currentMetrics.totalBets + 1;
    const profitLoss = currentMetrics.profitLoss + payout;
    const roi = profitLoss / (totalBets * 100); // Assuming average stake of 100

    return {
      ...currentMetrics,
      totalBets,
      profitLoss,
      roi,
      winRate: (currentMetrics.winRate * (totalBets - 1) + (payout > 0 ? 1 : 0)) / totalBets
    };
  }

  private initializeMetrics(): BettingMetrics {
    return {
      totalBets: 0,
      winningBets: 0,
      losingBets: 0,
      totalStake: 0,
      totalPnl: 0,
      roi: 0,
      winRate: 0,
      averageStake: 0,
      averagePnl: 0,
      lastUpdate: Date.now()
    };
  }

  private initializeRiskProfile(): RiskProfile {
    return {
      maxExposure: 1000,
      maxPositions: 10,
      stopLoss: 0.1,
      profitTarget: 0.2,
      riskPerTrade: 0.02,
      maxDrawdown: 0.15
    };
  }

  private async handleOpportunity(opportunity: BettingOpportunity): Promise<void> {
    const traceId = this.performanceMonitor.startTrace('handle-opportunity');
    try {
      // Check if we should take this opportunity
      if (!this.shouldTakeOpportunity(opportunity)) {
        this.performanceMonitor.endTrace(traceId);
        return;
      }

      // Calculate optimal stake
      const stake = this.calculateOptimalStake(opportunity);

      // Create betting position
      const position = await this.createPosition(opportunity, stake);

      // Update metrics
      this.updateMetrics(position);

      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      this.monitor.logError('betting', error as Error);
    }
  }

  private shouldTakeOpportunity(opportunity: BettingOpportunity): boolean {
    // Check confidence threshold
    if (opportunity.confidence < 0.7) return false;

    // Check current exposure
    const currentExposure = this.calculateCurrentExposure();
    if (currentExposure >= this.riskProfile.maxExposure) return false;

    // Check number of open positions
    if (this.getOpenPositions().length >= this.riskProfile.maxPositions) return false;

    // Check risk factors
    const riskFactors = opportunity.analysis.riskFactors;
    if (riskFactors.includes('high_volatility') || riskFactors.includes('low_liquidity')) {
      return false;
    }

    return true;
  }

  private calculateOptimalStake(opportunity: BettingOpportunity): number {
    // Kelly Criterion calculation
    const winProbability = opportunity.confidence;
    const lossProbability = 1 - winProbability;
    const edge = Math.abs(opportunity.expectedValue - opportunity.marketState.line) / opportunity.marketState.line;

    const kellyFraction = (winProbability * (1 + edge) - lossProbability) / edge;
    const conservativeKelly = kellyFraction * 0.5; // Use half Kelly for safety

    // Apply position sizing rules
    const maxPositionSize = this.riskProfile.maxExposure * this.riskProfile.riskPerTrade;
    const recommendedStake = Math.min(
      maxPositionSize,
      this.riskProfile.maxExposure * conservativeKelly
    );

    return Math.max(0, recommendedStake);
  }

  private async createPosition(
    opportunity: BettingOpportunity,
    stake: number
  ): Promise<BettingPosition> {
    const position: BettingPosition = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      propId: opportunity.propId,
      type: opportunity.type,
      stake,
      entryPrice: opportunity.marketState.line,
      timestamp: Date.now(),
      status: 'open'
    };

    this.positions.set(position.id, position);
    return position;
  }

  private updateMetrics(position: BettingPosition): void {
    this.metrics.totalBets++;
    this.metrics.totalStake += position.stake;
    this.metrics.averageStake = this.metrics.totalStake / this.metrics.totalBets;

    if (position.status === 'closed' && position.pnl !== undefined) {
      this.metrics.totalPnl += position.pnl;
      this.metrics.averagePnl = this.metrics.totalPnl / this.metrics.totalBets;
      this.metrics.roi = this.metrics.totalPnl / this.metrics.totalStake;

      if (position.pnl > 0) {
        this.metrics.winningBets++;
      } else {
        this.metrics.losingBets++;
      }

      this.metrics.winRate = this.metrics.winningBets / this.metrics.totalBets;
    }

    this.metrics.lastUpdate = Date.now();
  }

  private calculateCurrentExposure(): number {
    return Array.from(this.positions.values())
      .filter(p => p.status === 'open')
      .reduce((sum, p) => sum + p.stake, 0);
  }

  private getOpenPositions(): BettingPosition[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'open');
  }

  public async closePosition(positionId: string, closePrice: number): Promise<void> {
    const position = this.positions.get(positionId);
    if (!position || position.status !== 'open') {
      throw new Error(`Cannot close position ${positionId}`);
    }

    const pnl = this.calculatePnl(position, closePrice);
    
    position.status = 'closed';
    position.closePrice = closePrice;
    position.closeTimestamp = Date.now();
    position.pnl = pnl;

    this.updateMetrics(position);
  }

  private calculatePnl(position: BettingPosition, closePrice: number): number {
    const priceChange = closePrice - position.entryPrice;
    const multiplier = position.type === 'OVER' ? 1 : -1;
    return position.stake * priceChange * multiplier;
  }

  public getMetrics(): BettingMetrics {
    return { ...this.metrics };
  }

  public getRiskProfile(): RiskProfile {
    return { ...this.riskProfile };
  }

  public getPosition(positionId: string): BettingPosition | undefined {
    return this.positions.get(positionId);
  }

  public getAllPositions(): BettingPosition[] {
    return Array.from(this.positions.values());
  }

  public async evaluatePosition(positionId: string): Promise<{
    currentPnl: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: 'hold' | 'close';
  }> {
    const position = this.positions.get(positionId);
    if (!position || position.status !== 'open') {
      throw new Error(`Invalid position ${positionId}`);
    }

    const marketData = await this.dataEngine.getMarketData(position.propId);
    const currentPnl = this.calculatePnl(position, marketData.line);
    const pnlPercent = currentPnl / position.stake;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (pnlPercent <= -this.riskProfile.stopLoss) {
      riskLevel = 'high';
    } else if (pnlPercent < 0) {
      riskLevel = 'medium';
    }

    // Generate recommendation
    let recommendation: 'hold' | 'close' = 'hold';
    if (
      pnlPercent <= -this.riskProfile.stopLoss ||
      pnlPercent >= this.riskProfile.profitTarget
    ) {
      recommendation = 'close';
    }

    return {
      currentPnl,
      riskLevel,
      recommendation
    };
  }
}

export function toRiskTolerance(level: string): RiskTolerance {
  switch (level) {
    case 'LOW': return 'low';
    case 'MEDIUM': return 'medium';
    case 'HIGH': return 'high';
    default: return level as RiskTolerance;
  }
} 