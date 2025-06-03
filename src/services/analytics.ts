import { apiService } from './api';

interface AnalyticsConfig {
  apiKey: string;
  baseUrl: string;
}

interface PerformanceMetrics {
  accuracy: number;
  profitLoss: number;
  roi: number;
  winRate: number;
  averageOdds: number;
  sampleSize: number;
  sharpeRatio: number;
  maxDrawdown: number;
  bestPerformingSport: string;
  bestPerformingProp: string;
}

interface ModelPerformance {
  modelId: string;
  name: string;
  metrics: PerformanceMetrics;
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  featureImportance: {
    feature: string;
    importance: number;
  }[];
}

interface BettingInsights {
  topOpportunities: {
    eventId: string;
    market: string;
    edge: number;
    confidence: number;
    expectedValue: number;
  }[];
  riskMetrics: {
    kellyFraction: number;
    variance: number;
    correlation: number;
  };
  marketEfficiency: {
    sport: string;
    market: string;
    efficiency: number;
    bias: number;
  }[];
}

class AnalyticsService {
  private config: AnalyticsConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_ANALYTICS_API_KEY || '',
      baseUrl: process.env.REACT_APP_ANALYTICS_API_URL || 'https://api.analytics.com',
    };
  }

  async getPerformanceMetrics(options?: {
    startDate?: string;
    endDate?: string;
    sport?: string;
    market?: string;
  }): Promise<PerformanceMetrics> {
    try {
      const params: any = {
        apiKey: this.config.apiKey,
        ...options,
      };

      const response = await apiService.get<PerformanceMetrics>(
        '/analytics/performance',
        params
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      throw error;
    }
  }

  async getModelPerformance(modelId: string): Promise<ModelPerformance> {
    try {
      const response = await apiService.get<ModelPerformance>(
        `/analytics/models/${modelId}/performance`,
        { apiKey: this.config.apiKey }
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch model performance:', error);
      throw error;
    }
  }

  async getBettingInsights(options?: {
    sport?: string;
    market?: string;
    minConfidence?: number;
  }): Promise<BettingInsights> {
    try {
      const params: any = {
        apiKey: this.config.apiKey,
        ...options,
      };

      const response = await apiService.get<BettingInsights>(
        '/analytics/insights',
        params
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch betting insights:', error);
      throw error;
    }
  }

  async getHistoricalPerformance(days: number): Promise<{
    date: string;
    metrics: PerformanceMetrics;
  }[]> {
    try {
      const response = await apiService.get(
        '/analytics/history',
        {
          apiKey: this.config.apiKey,
          days,
        }
      );
      return response;
    } catch (error) {
      console.error('Failed to fetch historical performance:', error);
      throw error;
    }
  }

  async getRiskAnalysis(eventId: string): Promise<{
    riskLevel: 'low' | 'medium' | 'high';
    factors: {
      name: string;
      impact: number;
      description: string;
    }[];
    recommendations: {
      action: string;
      priority: number;
      description: string;
    }[];
  }> {
    try {
      const response = await apiService.get(
        `/analytics/risk/${eventId}`,
        { apiKey: this.config.apiKey }
      );
      return response;
    } catch (error) {
      console.error('Failed to get risk analysis:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService(); 