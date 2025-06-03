import { apiService } from './api';
import { oddsService } from './odds';
import { sportradarService } from './sportradar';
import { sentimentService } from './sentiment';
import { Bet, Event, Analytics } from '@/types';
import { scheduler } from '@/utils/scheduler';

interface StrategyConfig {
  name: string;
  description: string;
  type: 'value' | 'arbitrage' | 'sentiment' | 'statistical' | 'hybrid';
  parameters: {
    [key: string]: any;
  };
  riskLevel: 'low' | 'medium' | 'high';
  maxStake: number;
  minOdds: number;
  maxOdds: number;
  minConfidence: number;
  maxBetsPerDay: number;
  maxConcurrentBets: number;
  stopLoss: number;
  takeProfit: number;
}

interface StrategyPerformance {
  strategyId: string;
  totalBets: number;
  winningBets: number;
  losingBets: number;
  winRate: number;
  profitLoss: number;
  roi: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageOdds: number;
  averageStake: number;
  bestStreak: number;
  worstStreak: number;
  lastUpdated: string;
}

class StrategyService {
  private strategies: Map<string, StrategyConfig> = new Map();
  private performance: Map<string, StrategyPerformance> = new Map();
  private automation: Map<string, boolean> = new Map();
  private defaultInterval = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.initializeDefaultStrategies();
  }

  private initializeDefaultStrategies() {
    // Value Betting Strategy
    this.addStrategy({
      name: 'Value Betting',
      description: 'Identifies bets where the true probability is higher than the implied probability',
      type: 'value',
      parameters: {
        minEdge: 0.05,
        maxEdge: 0.20,
        minVolume: 100,
        maxVolume: 1000,
      },
      riskLevel: 'medium',
      maxStake: 100,
      minOdds: 1.5,
      maxOdds: 5.0,
      minConfidence: 0.7,
      maxBetsPerDay: 10,
      maxConcurrentBets: 3,
      stopLoss: -500,
      takeProfit: 1000,
    });

    // Arbitrage Strategy
    this.addStrategy({
      name: 'Arbitrage',
      description: 'Identifies and executes arbitrage opportunities across bookmakers',
      type: 'arbitrage',
      parameters: {
        minEdge: 0.01,
        maxEdge: 0.05,
        minLiquidity: 1000,
        maxLiquidity: 10000,
      },
      riskLevel: 'low',
      maxStake: 1000,
      minOdds: 1.01,
      maxOdds: 1000,
      minConfidence: 0.95,
      maxBetsPerDay: 20,
      maxConcurrentBets: 5,
      stopLoss: -100,
      takeProfit: 500,
    });

    // Sentiment Strategy
    this.addStrategy({
      name: 'Sentiment Analysis',
      description: 'Uses social media and news sentiment to identify betting opportunities',
      type: 'sentiment',
      parameters: {
        minSentimentScore: 0.6,
        maxSentimentScore: 0.9,
        minVolume: 50,
        maxVolume: 500,
      },
      riskLevel: 'high',
      maxStake: 50,
      minOdds: 2.0,
      maxOdds: 10.0,
      minConfidence: 0.6,
      maxBetsPerDay: 5,
      maxConcurrentBets: 2,
      stopLoss: -200,
      takeProfit: 500,
    });

    // Statistical Strategy
    this.addStrategy({
      name: 'Statistical Analysis',
      description: 'Uses historical data and statistical models to identify betting opportunities',
      type: 'statistical',
      parameters: {
        minSampleSize: 100,
        maxSampleSize: 1000,
        minR2: 0.7,
        maxR2: 0.95,
      },
      riskLevel: 'medium',
      maxStake: 100,
      minOdds: 1.5,
      maxOdds: 5.0,
      minConfidence: 0.8,
      maxBetsPerDay: 8,
      maxConcurrentBets: 3,
      stopLoss: -300,
      takeProfit: 800,
    });
  }

  addStrategy(config: StrategyConfig): void {
    this.strategies.set(config.name, config);
    this.performance.set(config.name, {
      strategyId: config.name,
      totalBets: 0,
      winningBets: 0,
      losingBets: 0,
      winRate: 0,
      profitLoss: 0,
      roi: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      averageOdds: 0,
      averageStake: 0,
      bestStreak: 0,
      worstStreak: 0,
      lastUpdated: new Date().toISOString(),
    });
  }

  async executeStrategy(strategyName: string): Promise<Bet[]> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    const performance = this.performance.get(strategyName);
    if (!performance) {
      throw new Error(`Performance data for strategy ${strategyName} not found`);
    }

    // Check if strategy is within limits
    if (performance.totalBets >= strategy.maxBetsPerDay) {
      throw new Error(`Strategy ${strategyName} has reached maximum bets per day`);
    }

    if (performance.profitLoss <= strategy.stopLoss) {
      throw new Error(`Strategy ${strategyName} has reached stop loss`);
    }

    if (performance.profitLoss >= strategy.takeProfit) {
      throw new Error(`Strategy ${strategyName} has reached take profit`);
    }

    // Get opportunities based on strategy type
    const opportunities = await this.getOpportunities(strategy);
    if (!opportunities.length) {
      return [];
    }

    // Filter and rank opportunities
    const filteredOpportunities = this.filterOpportunities(opportunities, strategy);
    const rankedOpportunities = this.rankOpportunities(filteredOpportunities, strategy);

    // Execute bets
    const bets: Bet[] = [];
    for (const opportunity of rankedOpportunities) {
      if (bets.length >= strategy.maxConcurrentBets) {
        break;
      }

      try {
        const bet = await this.placeBet(opportunity, strategy);
        bets.push(bet);
        await this.updatePerformance(strategyName, bet);
      } catch (error) {
        console.error(`Failed to place bet for opportunity:`, error);
      }
    }

    return bets;
  }

  private async getOpportunities(strategy: StrategyConfig): Promise<any[]> {
    switch (strategy.type) {
      case 'value':
        return this.getValueOpportunities(strategy);
      case 'arbitrage':
        return this.getArbitrageOpportunities(strategy);
      case 'sentiment':
        return this.getSentimentOpportunities(strategy);
      case 'statistical':
        return this.getStatisticalOpportunities(strategy);
      case 'hybrid':
        return this.getHybridOpportunities(strategy);
      default:
        throw new Error(`Unknown strategy type: ${strategy.type}`);
    }
  }

  private async getValueOpportunities(strategy: StrategyConfig): Promise<any[]> {
    const odds = await oddsService.getOdds();
    const opportunities = [];

    for (const event of odds) {
      for (const market of event.markets) {
        for (const selection of market.selections) {
          const edge = selection.probability - (1 / selection.odds);
          if (edge >= strategy.parameters.minEdge && edge <= strategy.parameters.maxEdge) {
            opportunities.push({
              event,
              market,
              selection,
              edge,
              confidence: this.calculateConfidence(edge, strategy),
            });
          }
        }
      }
    }

    return opportunities;
  }

  private async getArbitrageOpportunities(strategy: StrategyConfig): Promise<any[]> {
    return oddsService.getArbitrageOpportunities({
      minEdge: strategy.parameters.minEdge,
      maxEdge: strategy.parameters.maxEdge,
    });
  }

  private async getSentimentOpportunities(strategy: StrategyConfig): Promise<any[]> {
    const odds = await oddsService.getOdds();
    const opportunities = [];

    for (const event of odds) {
      const sentiment = await sentimentService.getSentiment(event.homeTeam);
      if (sentiment.score >= strategy.parameters.minSentimentScore &&
          sentiment.score <= strategy.parameters.maxSentimentScore &&
          sentiment.confidence >= strategy.minConfidence) {
        opportunities.push({
          event,
          sentiment,
          confidence: sentiment.confidence,
        });
      }
    }

    return opportunities;
  }

  private async getStatisticalOpportunities(strategy: StrategyConfig): Promise<any[]> {
    const odds = await oddsService.getOdds();
    const opportunities = [];

    for (const event of odds) {
      const homeStats = await sportradarService.getTeamStats(event.homeTeam);
      const awayStats = await sportradarService.getTeamStats(event.awayTeam);

      const model = this.buildStatisticalModel(homeStats, awayStats);
      if (model.r2 >= strategy.parameters.minR2 && model.r2 <= strategy.parameters.maxR2) {
        opportunities.push({
          event,
          model,
          confidence: model.r2,
        });
      }
    }

    return opportunities;
  }

  private async getHybridOpportunities(strategy: StrategyConfig): Promise<any[]> {
    const [valueOpps, arbitrageOpps, sentimentOpps, statisticalOpps] = await Promise.all([
      this.getValueOpportunities(strategy),
      this.getArbitrageOpportunities(strategy),
      this.getSentimentOpportunities(strategy),
      this.getStatisticalOpportunities(strategy),
    ]);

    return this.combineOpportunities([
      { type: 'value', opportunities: valueOpps },
      { type: 'arbitrage', opportunities: arbitrageOpps },
      { type: 'sentiment', opportunities: sentimentOpps },
      { type: 'statistical', opportunities: statisticalOpps },
    ], strategy);
  }

  private filterOpportunities(opportunities: any[], strategy: StrategyConfig): any[] {
    return opportunities.filter(opp => {
      // Filter by odds range
      if (opp.odds < strategy.minOdds || opp.odds > strategy.maxOdds) {
        return false;
      }

      // Filter by confidence
      if (opp.confidence < strategy.minConfidence) {
        return false;
      }

      // Filter by volume/liquidity
      if (opp.volume < strategy.parameters.minVolume ||
          opp.volume > strategy.parameters.maxVolume) {
        return false;
      }

      return true;
    });
  }

  private rankOpportunities(opportunities: any[], strategy: StrategyConfig): any[] {
    return opportunities.sort((a, b) => {
      // Calculate score based on strategy type
      const scoreA = this.calculateOpportunityScore(a, strategy);
      const scoreB = this.calculateOpportunityScore(b, strategy);
      return scoreB - scoreA;
    });
  }

  private calculateOpportunityScore(opportunity: any, strategy: StrategyConfig): number {
    switch (strategy.type) {
      case 'value':
        return opportunity.edge * opportunity.confidence;
      case 'arbitrage':
        return opportunity.edge * opportunity.confidence;
      case 'sentiment':
        return opportunity.sentiment.score * opportunity.confidence;
      case 'statistical':
        return opportunity.model.r2 * opportunity.confidence;
      case 'hybrid':
        return this.calculateHybridScore(opportunity, strategy);
      default:
        return 0;
    }
  }

  private calculateHybridScore(opportunity: any, strategy: StrategyConfig): number {
    const weights = {
      value: 0.3,
      arbitrage: 0.2,
      sentiment: 0.2,
      statistical: 0.3,
    };

    let score = 0;
    if (opportunity.value) {
      score += opportunity.value.edge * weights.value;
    }
    if (opportunity.arbitrage) {
      score += opportunity.arbitrage.edge * weights.arbitrage;
    }
    if (opportunity.sentiment) {
      score += opportunity.sentiment.score * weights.sentiment;
    }
    if (opportunity.statistical) {
      score += opportunity.statistical.model.r2 * weights.statistical;
    }

    return score * opportunity.confidence;
  }

  private async placeBet(opportunity: any, strategy: StrategyConfig): Promise<Bet> {
    const stake = this.calculateStake(opportunity, strategy);
    return apiService.post<Bet>('/bets', {
      eventId: opportunity.event.id,
      market: opportunity.market.name,
      selection: opportunity.selection.name,
      odds: opportunity.selection.odds,
      stake,
      potentialWinnings: stake * opportunity.selection.odds,
    });
  }

  private calculateStake(opportunity: any, strategy: StrategyConfig): number {
    const baseStake = strategy.maxStake;
    const confidenceMultiplier = opportunity.confidence;
    const edgeMultiplier = opportunity.edge || 1;
    const riskMultiplier = this.getRiskMultiplier(strategy.riskLevel);

    return Math.min(
      baseStake * confidenceMultiplier * edgeMultiplier * riskMultiplier,
      strategy.maxStake
    );
  }

  private getRiskMultiplier(riskLevel: string): number {
    switch (riskLevel) {
      case 'low':
        return 0.5;
      case 'medium':
        return 1.0;
      case 'high':
        return 1.5;
      default:
        return 1.0;
    }
  }

  private calculateConfidence(edge: number, strategy: StrategyConfig): number {
    const minEdge = strategy.parameters.minEdge;
    const maxEdge = strategy.parameters.maxEdge;
    return (edge - minEdge) / (maxEdge - minEdge);
  }

  private buildStatisticalModel(homeStats: any, awayStats: any): any {
    // Implement statistical model building
    // This is a placeholder - you would implement your own statistical model
    return {
      r2: 0.8,
      predictions: {},
    };
  }

  private combineOpportunities(opportunitySets: any[], strategy: StrategyConfig): any[] {
    const combined = new Map();

    for (const set of opportunitySets) {
      for (const opp of set.opportunities) {
        const key = `${opp.event.id}-${opp.market?.name || ''}`;
        if (!combined.has(key)) {
          combined.set(key, {
            event: opp.event,
            market: opp.market,
            selection: opp.selection,
            confidence: opp.confidence,
            [set.type]: opp,
          });
        } else {
          const existing = combined.get(key);
          existing[set.type] = opp;
          existing.confidence = (existing.confidence + opp.confidence) / 2;
        }
      }
    }

    return Array.from(combined.values());
  }

  private async updatePerformance(strategyName: string, bet: Bet): Promise<void> {
    const performance = this.performance.get(strategyName);
    if (!performance) {
      return;
    }

    performance.totalBets++;
    if (bet.status === 'won') {
      performance.winningBets++;
    } else if (bet.status === 'lost') {
      performance.losingBets++;
    }

    performance.winRate = performance.winningBets / performance.totalBets;
    performance.profitLoss += bet.result?.amount || 0;
    performance.roi = performance.profitLoss / (performance.totalBets * bet.stake);
    performance.averageOdds = (performance.averageOdds * (performance.totalBets - 1) + bet.odds) / performance.totalBets;
    performance.averageStake = (performance.averageStake * (performance.totalBets - 1) + bet.stake) / performance.totalBets;

    // Update streaks
    if (bet.status === 'won') {
      performance.bestStreak = Math.max(performance.bestStreak, performance.winningBets);
      performance.worstStreak = 0;
    } else if (bet.status === 'lost') {
      performance.worstStreak = Math.max(performance.worstStreak, performance.losingBets);
      performance.bestStreak = 0;
    }

    performance.lastUpdated = new Date().toISOString();
    this.performance.set(strategyName, performance);
  }

  getStrategy(strategyName: string): StrategyConfig | undefined {
    return this.strategies.get(strategyName);
  }

  getPerformance(strategyName: string): StrategyPerformance | undefined {
    return this.performance.get(strategyName);
  }

  getAllStrategies(): StrategyConfig[] {
    return Array.from(this.strategies.values());
  }

  getAllPerformance(): StrategyPerformance[] {
    return Array.from(this.performance.values());
  }

  startAutomation(strategyName: string, interval: number = this.defaultInterval) {
    if (!this.strategies.has(strategyName)) throw new Error(`Strategy ${strategyName} not found`);
    if (scheduler.isScheduled(strategyName)) return;
    scheduler.schedule(strategyName, async () => {
      try {
        await this.executeStrategy(strategyName);
        // Optionally: notify user or log
      } catch (err) {
        console.error(`[Automation] Error executing strategy '${strategyName}':`, err);
      }
    }, interval);
    this.automation.set(strategyName, true);
  }

  stopAutomation(strategyName: string) {
    scheduler.cancel(strategyName);
    this.automation.set(strategyName, false);
  }

  isAutomated(strategyName: string): boolean {
    return !!this.automation.get(strategyName);
  }

  stopAllAutomation() {
    scheduler.cancelAll();
    this.automation.clear();
  }
}

export const strategyService = new StrategyService(); 