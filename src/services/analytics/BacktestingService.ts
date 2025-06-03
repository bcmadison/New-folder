import { PlayerPropService } from '../betting/playerPropService';
import { ModelTrainingService } from './modelTrainingService';
import { FeatureEngineeringService } from './featureEngineeringService';
import { dataIntegrationService } from '../data/dataIntegrationService';
import * as tf from '@tensorflow/tfjs';
import dayjs from 'dayjs';

interface BacktestConfig {
  startDate: string;
  endDate: string;
  modelIds: string[];
  propTypes: string[];
  minConfidence: number;
  minValue: number;
  maxRisk: number;
  targetLegs: number;
  initialBankroll: number;
  stakeSize: number | 'kelly';
  riskManagement: {
    maxPositionSize: number;
    stopLoss: number;
    maxDrawdown: number;
  };
}

interface BacktestResult {
  summary: {
    totalBets: number;
    winningBets: number;
    losingBets: number;
    winRate: number;
    roi: number;
    profitLoss: number;
    maxDrawdown: number;
    sharpeRatio: number;
    kellyFraction: number;
  };
  modelPerformance: Record<string, {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    profitContribution: number;
  }>;
  propTypePerformance: Record<string, {
    totalBets: number;
    winRate: number;
    roi: number;
    averageEdge: number;
  }>;
  timeSeriesMetrics: {
    timestamp: number;
    bankroll: number;
    dailyPnL: number;
    runningWinRate: number;
    drawdown: number;
  }[];
  riskMetrics: {
    valueAtRisk: number;
    expectedShortfall: number;
    betaSharpe: number;
    informationRatio: number;
  };
}

interface SimulatedBet {
  timestamp: number;
  prop: {
    player: string;
    type: string;
    line: number;
    odds: { over: number; under: number };
  };
  prediction: {
    value: number;
    confidence: number;
    edge: number;
  };
  decision: {
    side: 'over' | 'under';
    stake: number;
    odds: number;
  };
  result: {
    actualValue: number;
    won: boolean;
    pnl: number;
  };
}

export class BacktestingService {
  private readonly playerPropService: PlayerPropService;
  private readonly modelTraining: ModelTrainingService;
  private readonly featureEngineering: FeatureEngineeringService;

  constructor(
    playerPropService: PlayerPropService,
    modelTraining: ModelTrainingService,
    featureEngineering: FeatureEngineeringService
  ) {
    this.playerPropService = playerPropService;
    this.modelTraining = modelTraining;
    this.featureEngineering = featureEngineering;
  }

  public async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    try {
      // Load historical data
      const historicalData = await this.loadHistoricalData(config);

      // Initialize tracking variables
      let bankroll = config.initialBankroll;
      let maxBankroll = bankroll;
      let currentDrawdown = 0;
      let maxDrawdown = 0;
      const dailyPnL: Record<string, number> = {};
      const bets: SimulatedBet[] = [];

      // Run simulation
      for (const date of this.getDateRange(config.startDate, config.endDate)) {
        const dayData = historicalData[date];
        if (!dayData) continue;

        // Get available props for the day
        const availableProps = await this.getAvailableProps(dayData);
        
        // Analyze props and generate predictions
        const propAnalyses = await Promise.all(
          availableProps.map(prop => this.analyzeProp(prop, config.modelIds))
        );

        // Filter qualified props
        const qualifiedProps = propAnalyses.filter(analysis =>
          this.qualifiesProp(analysis, config)
        );

        // Optimize lineup if needed
        const selectedProps = config.targetLegs > 1
          ? await this.optimizeLineup(qualifiedProps, config)
          : qualifiedProps;

        // Place simulated bets
        for (const prop of selectedProps) {
          const bet = await this.simulateBet(prop, bankroll, config);
          bets.push(bet);

          // Update bankroll and metrics
          bankroll += bet.result.pnl;
          maxBankroll = Math.max(maxBankroll, bankroll);
          currentDrawdown = (maxBankroll - bankroll) / maxBankroll;
          maxDrawdown = Math.max(maxDrawdown, currentDrawdown);

          // Update daily P&L
          const day = dayjs(bet.timestamp).format('YYYY-MM-DD');
          dailyPnL[day] = (dailyPnL[day] || 0) + bet.result.pnl;
        }

        // Check stop loss and drawdown limits
        if (this.shouldStopTrading(bankroll, maxDrawdown, config)) {
          break;
        }
      }

      // Calculate final metrics
      return this.calculateBacktestResults(bets, config, {
        finalBankroll: bankroll,
        maxDrawdown,
        dailyPnL
      });
    } catch (error) {
      console.error('Backtest failed:', error);
      throw error;
    }
  }

  private async loadHistoricalData(
    config: BacktestConfig
  ): Promise<Record<string, any>> {
    // Load historical data from data integration service
    const data = await dataIntegrationService.fetchHistoricalData({
      startDate: config.startDate,
      endDate: config.endDate,
      propTypes: config.propTypes
    });

    return this.organizeDataByDate(data);
  }

  private organizeDataByDate(data: any): Record<string, any> {
    // Organize raw data by date for efficient access
    const organized: Record<string, any> = {};
    
    for (const item of data) {
      const date = dayjs(item.timestamp).format('YYYY-MM-DD');
      organized[date] = organized[date] || [];
      organized[date].push(item);
    }

    return organized;
  }

  private getDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end) || currentDate.isSame(end)) {
      dates.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'day');
    }

    return dates;
  }

  private async getAvailableProps(dayData: any[]): Promise<any[]> {
    // Extract available props from day's data
    return dayData.map(item => ({
      player: item.player,
      type: item.propType,
      line: item.line,
      odds: item.odds,
      timestamp: item.timestamp
    }));
  }

  private async analyzeProp(prop: any, modelIds: string[]): Promise<any> {
    // Get predictions from each model
    const predictions = await Promise.all(
      modelIds.map(async modelId => {
        const model = await this.modelTraining.loadModel(modelId);
        if (!model) throw new Error(`Model ${modelId} not found`);

        const features = await this.featureEngineering.engineerFeatures(
          prop.player,
          prop.type,
          { /* raw data */ }
        );

        return {
          modelId,
          prediction: await this.predict(model, features)
        };
      })
    );

    // Combine predictions using ensemble weights
    return this.combineModelPredictions(predictions, prop);
  }

  private async predict(model: any, features: any): Promise<any> {
    // Make prediction using model
    if (model.model instanceof tf.LayersModel) {
      const tensor = tf.tensor2d([features.numerical]);
      const prediction = model.model.predict(tensor) as tf.Tensor;
      const value = (await prediction.data())[0];
      prediction.dispose();
      tensor.dispose();
      return value;
    }

    return model.model.predict([features.numerical])[0];
  }

  private combineModelPredictions(predictions: any[], prop: any): any {
    // Combine predictions using weighted ensemble
    const totalWeight = predictions.reduce((sum, p) => sum + p.prediction.confidence, 0);
    const weightedPrediction = predictions.reduce((sum, p) => {
      return sum + (p.prediction.value * p.prediction.confidence);
    }, 0) / totalWeight;

    return {
      prop,
      prediction: {
        value: weightedPrediction,
        confidence: Math.min(...predictions.map(p => p.prediction.confidence)),
        edge: this.calculateEdge(weightedPrediction, prop)
      },
      modelPredictions: predictions
    };
  }

  private calculateEdge(predictedValue: number, prop: any): number {
    const impliedProbability = 1 / prop.odds.over; // Simplified
    return Math.abs(predictedValue - impliedProbability);
  }

  private qualifiesProp(
    analysis: any,
    config: BacktestConfig
  ): boolean {
    return (
      analysis.prediction.confidence >= config.minConfidence &&
      analysis.prediction.edge >= config.minValue &&
      this.calculateRiskScore(analysis) <= config.maxRisk
    );
  }

  private calculateRiskScore(analysis: any): number {
    // Calculate risk score based on various factors
    return Math.random(); // Placeholder implementation
  }

  private async optimizeLineup(
    props: any[],
    config: BacktestConfig
  ): Promise<any[]> {
    // Use player prop service to optimize lineup
    const optimization = await this.playerPropService.optimizeLineup(
      props.map(p => p.prop),
      config.targetLegs
    );

    return optimization.legs;
  }

  private async simulateBet(
    prop: any,
    bankroll: number,
    config: BacktestConfig
  ): Promise<SimulatedBet> {
    const stake = this.calculateStakeSize(prop, bankroll, config);
    const side = prop.prediction.value > prop.prop.line ? 'over' : 'under';
    const odds = side === 'over' ? prop.prop.odds.over : prop.prop.odds.under;

    const actualValue = await this.getActualValue(prop.prop);
    const won = (side === 'over' && actualValue > prop.prop.line) ||
                (side === 'under' && actualValue < prop.prop.line);

    return {
      timestamp: prop.prop.timestamp,
      prop: prop.prop,
      prediction: prop.prediction,
      decision: {
        side,
        stake,
        odds
      },
      result: {
        actualValue,
        won,
        pnl: won ? stake * (odds - 1) : -stake
      }
    };
  }

  private calculateStakeSize(
    prop: any,
    bankroll: number,
    config: BacktestConfig
  ): number {
    if (config.stakeSize === 'kelly') {
      return this.calculateKellyStake(prop, bankroll, config);
    }
    return typeof config.stakeSize === 'number'
      ? Math.min(config.stakeSize, bankroll * config.riskManagement.maxPositionSize)
      : 0;
  }

  private calculateKellyStake(
    prop: any,
    bankroll: number,
    config: BacktestConfig
  ): number {
    const edge = prop.prediction.edge;
    const odds = prop.prop.odds.over; // Simplified
    const probability = prop.prediction.value;

    const kellyFraction = (edge * probability) / (odds - 1);
    const adjustedKelly = kellyFraction * 0.5; // Half Kelly for safety

    return Math.min(
      bankroll * adjustedKelly,
      bankroll * config.riskManagement.maxPositionSize
    );
  }

  private async getActualValue(prop: any): Promise<number> {
    // In real backtest, this would fetch the actual result
    // This is a placeholder implementation
    return prop.line + (Math.random() - 0.5) * 5;
  }

  private shouldStopTrading(
    bankroll: number,
    drawdown: number,
    config: BacktestConfig
  ): boolean {
    return (
      bankroll <= config.initialBankroll * (1 - config.riskManagement.stopLoss) ||
      drawdown >= config.riskManagement.maxDrawdown
    );
  }

  private calculateBacktestResults(
    bets: SimulatedBet[],
    config: BacktestConfig,
    metrics: {
      finalBankroll: number;
      maxDrawdown: number;
      dailyPnL: Record<string, number>;
    }
  ): BacktestResult {
    const winningBets = bets.filter(bet => bet.result.won);
    const dailyReturns = Object.values(metrics.dailyPnL).map(pnl => pnl / config.initialBankroll);

    return {
      summary: {
        totalBets: bets.length,
        winningBets: winningBets.length,
        losingBets: bets.length - winningBets.length,
        winRate: winningBets.length / bets.length,
        roi: (metrics.finalBankroll - config.initialBankroll) / config.initialBankroll,
        profitLoss: metrics.finalBankroll - config.initialBankroll,
        maxDrawdown: metrics.maxDrawdown,
        sharpeRatio: this.calculateSharpeRatio(dailyReturns),
        kellyFraction: this.calculateOptimalKellyFraction(bets)
      },
      modelPerformance: this.calculateModelPerformance(bets),
      propTypePerformance: this.calculatePropTypePerformance(bets),
      timeSeriesMetrics: this.calculateTimeSeriesMetrics(bets, config),
      riskMetrics: this.calculateRiskMetrics(dailyReturns)
    };
  }

  private calculateSharpeRatio(returns: number[]): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const riskFreeRate = 0.02 / 252; // Assuming 2% annual risk-free rate

    return (mean - riskFreeRate) / stdDev * Math.sqrt(252); // Annualized
  }

  private calculateOptimalKellyFraction(bets: SimulatedBet[]): number {
    const winRate = bets.filter(bet => bet.result.won).length / bets.length;
    const avgWin = bets.filter(bet => bet.result.won)
      .reduce((sum, bet) => sum + bet.result.pnl, 0) / bets.filter(bet => bet.result.won).length;
    const avgLoss = Math.abs(bets.filter(bet => !bet.result.won)
      .reduce((sum, bet) => sum + bet.result.pnl, 0) / bets.filter(bet => !bet.result.won).length);

    return (winRate / avgLoss - (1 - winRate) / avgWin);
  }

  private calculateModelPerformance(bets: SimulatedBet[]): Record<string, any> {
    // Calculate performance metrics for each model
    // This is a placeholder implementation
    return {};
  }

  private calculatePropTypePerformance(bets: SimulatedBet[]): Record<string, any> {
    // Calculate performance metrics for each prop type
    // This is a placeholder implementation
    return {};
  }

  private calculateTimeSeriesMetrics(
    bets: SimulatedBet[],
    config: BacktestConfig
  ): any[] {
    // Calculate time series metrics
    // This is a placeholder implementation
    return [];
  }

  private calculateRiskMetrics(returns: number[]): BacktestResult['riskMetrics'] {
    // Calculate risk metrics
    return {
      valueAtRisk: this.calculateVaR(returns, 0.95),
      expectedShortfall: this.calculateExpectedShortfall(returns, 0.95),
      betaSharpe: this.calculateBetaSharpe(returns),
      informationRatio: this.calculateInformationRatio(returns)
    };
  }

  private calculateVaR(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(returns.length * (1 - confidence));
    return -sortedReturns[index];
  }

  private calculateExpectedShortfall(returns: number[], confidence: number): number {
    const var95 = this.calculateVaR(returns, confidence);
    const tailReturns = returns.filter(r => r < -var95);
    return -(tailReturns.reduce((a, b) => a + b, 0) / tailReturns.length);
  }

  private calculateBetaSharpe(returns: number[]): number {
    // Calculate beta-adjusted Sharpe ratio
    // This is a placeholder implementation
    return 0;
  }

  private calculateInformationRatio(returns: number[]): number {
    // Calculate information ratio
    // This is a placeholder implementation
    return 0;
  }
}

export const backtestingService = new BacktestingService(
  playerPropService,
  modelTrainingService,
  featureEngineeringService
); 