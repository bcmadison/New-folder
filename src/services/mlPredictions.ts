import { Sport, PlayerStats, TeamStats } from './sportsAnalytics';
import { apiService } from './api';

export interface MLPrediction {
  probability: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  historicalAccuracy: number;
  expectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendedStake: number;
  edge: number;
}

interface PlayerMatchup {
  playerId: string;
  opponentId: string;
  advantage: number;
  matchupFactors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

interface GameStats {
  date: string;
  stats: Record<string, number>;
}

class MLPredictionService {
  private static instance: MLPredictionService;
  private readonly CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
  private cache: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): MLPredictionService {
    if (!MLPredictionService.instance) {
      MLPredictionService.instance = new MLPredictionService();
    }
    return MLPredictionService.instance;
  }

  async predictProp(
    sport: Sport,
    playerStats: PlayerStats,
    teamStats: TeamStats,
    propType: string,
    value: number
  ): Promise<MLPrediction> {
    const cacheKey = `pred_${sport}_${playerStats.playerId}_${propType}_${value}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const prediction = await this.generatePrediction(sport, playerStats, teamStats, propType, value);
      this.setCache(cacheKey, prediction);
      return prediction;
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw error;
    }
  }

  async analyzeMatchup(
    sport: Sport,
    playerStats: PlayerStats,
    opponentStats: TeamStats
  ): Promise<PlayerMatchup> {
    const cacheKey = `matchup_${sport}_${playerStats.playerId}_${opponentStats.teamId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const matchup = await this.generateMatchupAnalysis(sport, playerStats, opponentStats);
      this.setCache(cacheKey, matchup);
      return matchup;
    } catch (error) {
      console.error('Error analyzing matchup:', error);
      throw error;
    }
  }

  private async generatePrediction(
    sport: Sport,
    playerStats: PlayerStats,
    teamStats: TeamStats,
    propType: string,
    value: number
  ): Promise<MLPrediction> {
    // Calculate probability based on historical performance
    const relevantGames = playerStats.lastGames.filter(game => {
      const stat = game.stats[propType.toLowerCase()];
      return stat !== undefined;
    });

    const totalGames = relevantGames.length;
    const gamesOverLine = relevantGames.filter(game => {
      const stat = game.stats[propType.toLowerCase()];
      return stat !== undefined && stat > value;
    }).length;

    const probability = totalGames > 0 ? gamesOverLine / totalGames : 0.5;
    
    // Calculate confidence based on sample size and variance
    const confidence = this.calculateConfidence(relevantGames, propType, value);
    
    // Calculate edge based on probability and odds
    const edge = this.calculateEdge(probability, value);
    
    // Generate factors based on statistical analysis
    const factors = this.generateFactors(playerStats, teamStats, propType, value);

    return {
      probability,
      confidence,
      factors,
      historicalAccuracy: this.calculateHistoricalAccuracy(relevantGames, propType),
      expectedValue: this.calculateExpectedValue(probability, value),
      riskLevel: this.determineRiskLevel(probability, confidence, edge),
      recommendedStake: this.calculateRecommendedStake(probability, confidence, edge),
      edge,
    };
  }

  private async generateMatchupAnalysis(
    sport: Sport,
    playerStats: PlayerStats,
    opponentStats: TeamStats
  ): Promise<PlayerMatchup> {
    // Calculate matchup advantage based on team defensive stats
    const advantage = this.calculateMatchupAdvantage(playerStats, opponentStats);
    
    // Generate matchup factors
    const matchupFactors = this.generateMatchupFactors(playerStats, opponentStats);

    return {
      playerId: playerStats.playerId,
      opponentId: opponentStats.teamId,
      advantage,
      matchupFactors,
    };
  }

  private calculateConfidence(games: GameStats[], propType: string, value: number): number {
    if (games.length < 5) return 50; // Low confidence for small sample size

    const values = games.map(game => game.stats[propType.toLowerCase()] || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Higher confidence for lower variance and more games
    const sampleSizeFactor = Math.min(games.length / 20, 1);
    const varianceFactor = 1 - (stdDev / (mean * 2));
    
    return Math.round((sampleSizeFactor * 0.4 + varianceFactor * 0.6) * 100);
  }

  private calculateEdge(probability: number, value: number): number {
    // Convert American odds to decimal
    const decimalOdds = value > 0 ? (value / 100) + 1 : (100 / Math.abs(value)) + 1;
    
    // Calculate edge: (probability * decimalOdds) - 1
    return (probability * decimalOdds) - 1;
  }

  private generateFactors(
    playerStats: PlayerStats,
    teamStats: TeamStats,
    propType: string,
    value: number
  ): { name: string; impact: number; description: string }[] {
    const factors: { name: string; impact: number; description: string }[] = [];

    // Recent form factor
    const recentGames = playerStats.lastGames.length;
    const recentStats = playerStats.seasonAverages[propType.toLowerCase()];
    if (recentStats !== undefined) {
      const formImpact = recentStats > value ? 0.8 : 0.4;
      factors.push({
        name: 'Recent Form',
        impact: formImpact,
        description: `Player has averaged ${recentStats.toFixed(1)} ${propType} in last ${recentGames} games`,
      });
    }

    // Team pace factor
    const paceImpact = teamStats.pace > 100 ? 0.7 : 0.3;
    factors.push({
      name: 'Team Pace',
      impact: paceImpact,
      description: `Team plays at ${teamStats.pace.toFixed(1)} possessions per game`,
    });

    // Rest days factor
    const restImpact = playerStats.restDays >= 2 ? 0.8 : 0.5;
    factors.push({
      name: 'Rest Days',
      impact: restImpact,
      description: `Player has had ${playerStats.restDays} days of rest`,
    });

    return factors;
  }

  private calculateHistoricalAccuracy(games: GameStats[], propType: string): number {
    if (games.length === 0) return 0.5;

    const predictions = games.map(game => {
      const stat = game.stats[propType.toLowerCase()];
      return stat !== undefined ? (stat > game.stats.line ? 1 : 0) : 0;
    });

    const correctPredictions = predictions.reduce((a: number, b: number) => a + b, 0);
    return correctPredictions / predictions.length;
  }

  private calculateExpectedValue(probability: number, value: number): number {
    const decimalOdds = value > 0 ? (value / 100) + 1 : (100 / Math.abs(value)) + 1;
    return (probability * decimalOdds) - 1;
  }

  private determineRiskLevel(
    probability: number,
    confidence: number,
    edge: number
  ): 'low' | 'medium' | 'high' {
    if (probability >= 0.7 && confidence >= 80 && edge >= 0.1) {
      return 'low';
    } else if (probability >= 0.6 && confidence >= 60 && edge >= 0.05) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  private calculateRecommendedStake(
    probability: number,
    confidence: number,
    edge: number
  ): number {
    const baseStake = 100;
    const riskMultiplier = this.getRiskMultiplier(probability, confidence, edge);
    return Math.round(baseStake * riskMultiplier);
  }

  private getRiskMultiplier(
    probability: number,
    confidence: number,
    edge: number
  ): number {
    const riskLevel = this.determineRiskLevel(probability, confidence, edge);
    switch (riskLevel) {
      case 'low':
        return 1.0;
      case 'medium':
        return 0.5;
      case 'high':
        return 0.25;
    }
  }

  private calculateMatchupAdvantage(
    playerStats: PlayerStats,
    opponentStats: TeamStats
  ): number {
    // Calculate advantage based on player's stats vs opponent's defensive stats
    const playerOffense = playerStats.seasonAverages.points / playerStats.seasonAverages.minutes;
    const opponentDefense = opponentStats.defensiveRating;
    
    // Normalize to a 0-1 scale
    return Math.max(0, Math.min(1, (playerOffense / opponentDefense) * 1.5));
  }

  private generateMatchupFactors(
    playerStats: PlayerStats,
    opponentStats: TeamStats
  ): { name: string; impact: number; description: string }[] {
    const factors: { name: string; impact: number; description: string }[] = [];

    // Defensive rating factor
    const defRatingImpact = opponentStats.defensiveRating > 110 ? 0.8 : 0.4;
    factors.push({
      name: 'Defensive Rating',
      impact: defRatingImpact,
      description: `Opponent has a defensive rating of ${opponentStats.defensiveRating.toFixed(1)}`,
    });

    // Pace factor
    const paceImpact = opponentStats.pace > 100 ? 0.7 : 0.3;
    factors.push({
      name: 'Pace Factor',
      impact: paceImpact,
      description: `Opponent plays at ${opponentStats.pace.toFixed(1)} possessions per game`,
    });

    return factors;
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  // Sport-specific prediction methods
  async predictNBAProp(
    playerStats: PlayerStats,
    teamStats: TeamStats,
    propType: string,
    value: number
  ): Promise<MLPrediction> {
    return this.predictProp('nba', playerStats, teamStats, propType, value);
  }

  async predictWNBAProp(
    playerStats: PlayerStats,
    teamStats: TeamStats,
    propType: string,
    value: number
  ): Promise<MLPrediction> {
    return this.predictProp('nba', playerStats, teamStats, propType, value);
  }

  async predictMLBProp(
    playerStats: PlayerStats,
    teamStats: TeamStats,
    propType: string,
    value: number
  ): Promise<MLPrediction> {
    return this.predictProp('mlb', playerStats, teamStats, propType, value);
  }

  async predictSoccerProp(
    playerStats: PlayerStats,
    teamStats: TeamStats,
    propType: string,
    value: number
  ): Promise<MLPrediction> {
    return this.predictProp('soccer', playerStats, teamStats, propType, value);
  }
}

export const mlPredictions = MLPredictionService.getInstance(); 