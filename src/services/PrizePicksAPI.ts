import axios, { AxiosInstance } from 'axios';
import { UnifiedErrorHandler } from '../core/UnifiedError';
import { UnifiedConfigManager } from '../core/UnifiedConfig';
import { Sport, PropType } from '../types/common';

interface PrizePicksResponse<T> {
  data: T;
  meta: {
    timestamp: number;
    status: number;
  };
}

interface Projection {
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

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: Sport;
  stats: Record<string, number>;
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: Sport;
  league: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'final';
  score?: {
    home: number;
    away: number;
  };
}

export class PrizePicksAPI {
  private static instance: PrizePicksAPI;
  private readonly api: AxiosInstance;
  private readonly errorHandler: UnifiedErrorHandler;
  private readonly config: UnifiedConfigManager;

  private constructor() {
    this.errorHandler = UnifiedErrorHandler.getInstance();
    this.config = UnifiedConfigManager.getInstance();

    this.api = axios.create({
      baseURL: process.env.PRIZEPICKS_API_URL || 'https://api.prizepicks.com/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PRIZEPICKS_API_KEY}`
      }
    });

    // Add request interceptor for rate limiting
    this.api.interceptors.request.use(async (config) => {
      await this.rateLimiter();
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        this.handleApiError(error);
        throw error;
      }
    );
  }

  public static getInstance(): PrizePicksAPI {
    if (!PrizePicksAPI.instance) {
      PrizePicksAPI.instance = new PrizePicksAPI();
    }
    return PrizePicksAPI.instance;
  }

  public async getProjections(params: {
    sport?: Sport;
    propType?: PropType;
    playerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Projection[]> {
    const response = await this.api.get<PrizePicksResponse<Projection[]>>('/projections', {
      params
    });
    return response.data.data;
  }

  public async getPlayer(playerId: string): Promise<Player> {
    const response = await this.api.get<PrizePicksResponse<Player>>(`/players/${playerId}`);
    return response.data.data;
  }

  public async getGame(gameId: string): Promise<Game> {
    const response = await this.api.get<PrizePicksResponse<Game>>(`/games/${gameId}`);
    return response.data.data;
  }

  public async getPlayerProjections(playerId: string): Promise<Projection[]> {
    const response = await this.api.get<PrizePicksResponse<Projection[]>>('/projections', {
      params: { playerId }
    });
    return response.data.data;
  }

  public async getPlayerHistory(playerId: string, params: {
    startDate?: string;
    endDate?: string;
    propType?: PropType;
    limit?: number;
  }): Promise<Projection[]> {
    const response = await this.api.get<PrizePicksResponse<Projection[]>>(`/players/${playerId}/history`, {
      params
    });
    return response.data.data;
  }

  public async getTeamProjections(team: string, sport: Sport): Promise<Projection[]> {
    const response = await this.api.get<PrizePicksResponse<Projection[]>>('/projections', {
      params: { team, sport }
    });
    return response.data.data;
  }

  private async rateLimiter(): Promise<void> {
    // Implement rate limiting logic here
    // This is a placeholder - you would typically use a proper rate limiting library
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private handleApiError(error: any): void {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      this.errorHandler.handleError(new Error(
        `PrizePicks API Error: ${error.response.status} - ${error.response.data.message}`
      ));
    } else if (error.request) {
      // The request was made but no response was received
      this.errorHandler.handleError(new Error(
        'PrizePicks API Error: No response received from server'
      ));
    } else {
      // Something happened in setting up the request that triggered an Error
      this.errorHandler.handleError(new Error(
        `PrizePicks API Error: ${error.message}`
      ));
    }
  }
} 