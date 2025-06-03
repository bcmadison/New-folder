import { BookOdds, BettingOpportunity } from './bettingStrategy';


export interface WeatherCondition {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  humidity: number;
  windDirection: number;
}

export interface InjuryReport {
  playerId: string;
  playerName: string;
  position: string;
  status: 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE' | 'PROBABLE';
  details: string;
  impactScore: number;
}

export interface SentimentData {
  source: 'TWITTER' | 'NEWS' | 'REDDIT';
  sentiment: number; // -1 to 1
  volume: number;
  keywords: string[];
  timestamp: number;
}

export interface PredictionResult {
  predictedValue: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
  metadata: Record<string, any>;
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 to 1 scale
  confidence: number; // 0 to 1 scale
  description: string;
  metadata: Record<string, any>;
}

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  humidity: number;
  conditions: string;
}

export interface HistoricalPattern {
  pattern: string;
  similarity: number; // 0 to 1 scale
  outcome: string;
  confidence: number;
  metadata: {
    matchCount: number;
    winRate: number;
    averageOddsMovement: number;
  };
}

export class PredictionService {
  private static instance: PredictionService;
  private weatherCache: Map<string, WeatherData>;
  private injuryCache: Map<string, InjuryReport[]>;
  private sentimentCache: Map<string, SentimentData[]>;

  private constructor() {
    this.weatherCache = new Map();
    this.injuryCache = new Map();
    this.sentimentCache = new Map();
  }

  static getInstance(): PredictionService {
    if (!PredictionService.instance) {
      PredictionService.instance = new PredictionService();
    }
    return PredictionService.instance;
  }

  public async analyzePredictionFactors(
    opportunity: BettingOpportunity
  ): Promise<PredictionFactor[]> {
    const factors: PredictionFactor[] = [];

    // Analyze injuries
    const injuryFactors = await this.analyzeInjuryImpact(opportunity);
    factors.push(...injuryFactors);

    // Analyze weather (if applicable)
    const weatherFactors = await this.analyzeWeatherImpact(opportunity);
    if (weatherFactors) {
      factors.push(weatherFactors);
    }

    // Analyze sentiment
    const sentimentFactor = await this.analyzeSentiment(opportunity);
    factors.push(sentimentFactor);

    // Analyze historical patterns
    const patternFactors = await this.findHistoricalPatterns(opportunity);
    factors.push(...patternFactors);

    return this.normalizePredictionFactors(factors);
  }

  private async analyzeInjuryImpact(
    opportunity: BettingOpportunity
  ): Promise<PredictionFactor[]> {
    const injuries = this.injuryCache.get(opportunity.market) || [];
    const factors: PredictionFactor[] = [];

    for (const injury of injuries) {
      if (injury.impactScore > 0.3) { // Only consider significant injuries
        factors.push({
          name: 'Injury Impact',
          impact: -injury.impactScore,
          confidence: this.calculateInjuryConfidence(injury),
          description: `${injury.playerName} (${injury.position}) - ${injury.status}`,
          metadata: {
            playerId: injury.playerId,
            status: injury.status,
            position: injury.position
          }
        });
      }
    }

    return factors;
  }

  private calculateInjuryConfidence(injury: InjuryReport): number {
    const statusConfidence = {
      'OUT': 1,
      'DOUBTFUL': 0.75,
      'QUESTIONABLE': 0.5,
      'PROBABLE': 0.25
    };

    return statusConfidence[injury.status] * injury.impactScore;
  }

  private async analyzeWeatherImpact(
    opportunity: BettingOpportunity
  ): Promise<PredictionFactor | null> {
    const weather = this.weatherCache.get(opportunity.market);
    if (!weather) return null;

    const impact = this.calculateWeatherImpact(weather);
    if (Math.abs(impact) < 0.2) return null; // Only return significant weather impacts

    return {
      name: 'Weather Conditions',
      impact,
      confidence: 0.8, // Weather data is generally reliable
      description: `${weather.conditions} - ${weather.temperature}°F, Wind: ${weather.windSpeed}mph`,
      metadata: { ...weather }
    };
  }

  private calculateWeatherImpact(weather: WeatherData): number {
    let impact = 0;

    // Wind impact (negative for passing games)
    if (weather.windSpeed > 15) {
      impact -= (weather.windSpeed - 15) / 30;
    }

    // Precipitation impact
    if (weather.precipitation > 0) {
      impact -= weather.precipitation / 10;
    }

    // Temperature impact (extreme temperatures)
    const optimalTemp = 70;
    const tempDiff = Math.abs(weather.temperature - optimalTemp);
    if (tempDiff > 30) {
      impact -= (tempDiff - 30) / 50;
    }

    return Math.max(-1, Math.min(1, impact));
  }

  private async analyzeSentiment(
    opportunity: BettingOpportunity
  ): Promise<PredictionFactor> {
    const sentimentData = this.sentimentCache.get(opportunity.market) || [];
    
    if (sentimentData.length === 0) {
      return {
        name: 'Market Sentiment',
        impact: 0,
        confidence: 0,
        description: 'No sentiment data available',
        metadata: { dataPoints: 0 }
      };
    }

    const recentSentiment = sentimentData
      .filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000); // Last 24 hours

    const weightedScore = recentSentiment.reduce((acc, s) => 
      acc + (s.sentiment * Math.log(s.volume + 1)), 0
    );
    const totalWeight = recentSentiment.reduce((acc, s) => 
      acc + Math.log(s.volume + 1), 0
    );

    const averageSentiment = weightedScore / (totalWeight || 1);
    const confidence = Math.min(1, recentSentiment.length / 10); // Scale with data points

    return {
      name: 'Market Sentiment',
      impact: averageSentiment,
      confidence,
      description: `${recentSentiment.length} data points analyzed`,
      metadata: {
        dataPoints: recentSentiment.length,
        keywords: this.aggregateKeywords(recentSentiment)
      }
    };
  }

  private aggregateKeywords(sentimentData: SentimentData[]): string[] {
    const keywordCount = new Map<string, number>();
    
    sentimentData.forEach(data => {
      data.keywords.forEach(keyword => {
        keywordCount.set(keyword, (keywordCount.get(keyword) || 0) + 1);
      });
    });

    return Array.from(keywordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);
  }

  private async findHistoricalPatterns(
    opportunity: BettingOpportunity
  ): Promise<PredictionFactor[]> {
    const patterns = await this.findSimilarHistoricalScenarios(opportunity);
    
    return patterns.map(pattern => ({
      name: 'Historical Pattern',
      impact: this.calculatePatternImpact(pattern),
      confidence: pattern.confidence,
      description: pattern.pattern,
      metadata: pattern.metadata
    }));
  }

  private async findSimilarHistoricalScenarios(
    opportunity: BettingOpportunity
  ): Promise<HistoricalPattern[]> {
    // This would typically involve a call to a machine learning model
    // For now, return a placeholder implementation
    return [{
      pattern: 'Similar line movement pattern',
      similarity: 0.85,
      outcome: 'positive',
      confidence: 0.75,
      metadata: {
        matchCount: 15,
        winRate: 0.67,
        averageOddsMovement: 2.5
      }
    }];
  }

  private calculatePatternImpact(pattern: HistoricalPattern): number {
    const baseImpact = pattern.outcome === 'positive' ? 1 : -1;
    return baseImpact * pattern.similarity * pattern.confidence;
  }

  private normalizePredictionFactors(factors: PredictionFactor[]): PredictionFactor[] {
    const totalConfidence = factors.reduce((sum, factor) => sum + factor.confidence, 0);
    
    if (totalConfidence === 0) return factors;

    return factors.map(factor => ({
      ...factor,
      impact: factor.impact * (factor.confidence / totalConfidence)
    }));
  }

  // Cache management methods
  public updateWeatherData(market: string, data: WeatherData): void {
    this.weatherCache.set(market, data);
  }

  public updateInjuryData(market: string, data: InjuryReport[]): void {
    this.injuryCache.set(market, data);
  }

  public updateSentimentData(market: string, data: SentimentData): void {
    const existing = this.sentimentCache.get(market) || [];
    this.sentimentCache.set(market, [...existing, data]);
  }

  public clearCaches(): void {
    this.weatherCache.clear();
    this.injuryCache.clear();
    this.sentimentCache.clear();
  }
} 