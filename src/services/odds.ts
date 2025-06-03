import { apiService } from './api';

interface OddsConfig {
  baseUrl: string;
  apiKey: string;
}

interface OddsData {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  markets: {
    name: string;
    selections: {
      name: string;
      odds: number;
      probability: number;
    }[];
  }[];
  bookmakers: {
    name: string;
    markets: {
      name: string;
      selections: {
        name: string;
        odds: number;
      }[];
    }[];
  }[];
}

interface MarketAnalysis {
  market: string;
  bestOdds: {
    selection: string;
    odds: number;
    bookmaker: string;
  };
  averageOdds: number;
  impliedProbability: number;
  trueProbability: number;
  edge: number;
  confidence: number;
}

class OddsService {
  private config: OddsConfig;

  constructor() {
    this.config = {
      baseUrl: process.env.REACT_APP_ODDS_API_URL || 'https://api.the-odds-api.com/v4',
      apiKey: process.env.REACT_APP_ODDS_API_KEY || '8684be37505fc5ce63b0337d472af0ee',
    };
  }

  async getOdds(options?: {
    sport?: string;
    regions?: string[];
    markets?: string[];
    dateFormat?: string;
    oddsFormat?: string;
  }): Promise<OddsData[]> {
    try {
      const response = await apiService.get('/odds', {
        params: {
          ...options,
          apiKey: this.config.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get odds:', error);
      throw error;
    }
  }

  async getMarketAnalysis(market: string, options?: {
    sport?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<MarketAnalysis> {
    try {
      const response = await apiService.get(`/odds/markets/${market}/analysis`, {
        params: {
          ...options,
          apiKey: this.config.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get market analysis:', error);
      throw error;
    }
  }

  async getBookmakers(): Promise<string[]> {
    try {
      const response = await apiService.get('/odds/bookmakers', {
        params: {
          apiKey: this.config.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get bookmakers:', error);
      throw error;
    }
  }

  async getHistoricalOdds(market: string, options?: {
    startTime?: string;
    endTime?: string;
    bookmaker?: string;
  }): Promise<{
    timestamp: string;
    odds: number;
    probability: number;
  }[]> {
    try {
      const response = await apiService.get(`/odds/markets/${market}/history`, {
        params: {
          ...options,
          apiKey: this.config.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get historical odds:', error);
      throw error;
    }
  }

  async getArbitrageOpportunities(options?: {
    sport?: string;
    minEdge?: number;
    maxEdge?: number;
  }): Promise<{
    market: string;
    selections: {
      name: string;
      odds: number;
      bookmaker: string;
    }[];
    edge: number;
    confidence: number;
  }[]> {
    try {
      const response = await apiService.get('/odds/arbitrage', {
        params: {
          ...options,
          apiKey: this.config.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get arbitrage opportunities:', error);
      throw error;
    }
  }
}

export const oddsService = new OddsService(); 