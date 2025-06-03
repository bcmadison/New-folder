import axios, { AxiosInstance } from 'axios';
import { EventBus } from '../core/EventBus';
import { UnifiedConfigManager } from '../core/UnifiedConfig';


export interface ESPNConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  cacheTimeout: number;
}

export interface ESPNGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score?: number;
  };
  awayTeam: {
    id: string;
    name: string;
    abbreviation: string;
    score?: number;
  };
  startTime: string;
  status: 'scheduled' | 'inProgress' | 'final' | 'postponed';
  venue: {
    name: string;
    city: string;
    state: string;
  };
  weather?: {
    temperature: number;
    condition: string;
    windSpeed: number;
  };
}

export interface ESPNPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  jersey: string;
  status: 'active' | 'injured' | 'questionable' | 'out';
  stats: {
    [key: string]: number;
  };
  projections?: {
    [key: string]: number;
  };
}

export interface ESPNHeadline {
  id: string;
  title: string;
  description: string;
  link: string;
  published: string;
  updated: string;
  sport: string;
  league?: string;
  team?: string;
  player?: string;
  type: 'news' | 'injury' | 'rumor' | 'analysis';
}

export class ESPNService {
  private static instance: ESPNService;
  private readonly eventBus: EventBus;
  private readonly configManager: UnifiedConfigManager;
  private readonly client: AxiosInstance;
  private readonly cache: Map<string, {
    data: any;
    timestamp: number;
  }>;
  private readonly espnConfig: ESPNConfig;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.configManager = UnifiedConfigManager.getInstance();
    this.cache = new Map();
    this.espnConfig = this.initializeConfig();
    
    this.client = axios.create({
      baseURL: this.espnConfig.baseUrl,
      timeout: this.espnConfig.timeout,
      headers: {
        'x-api-key': this.espnConfig.apiKey
      }
    });

    this.setupEventListeners();
  }

  public static getInstance(): ESPNService {
    if (!ESPNService.instance) {
      ESPNService.instance = new ESPNService();
    }
    return ESPNService.instance;
  }

  private initializeConfig(): ESPNConfig {
    const config = this.configManager.getConfig();
    return {
      baseUrl: config.espn.baseUrl || 'https://api.espn.com/v1',
      apiKey: config.espn.apiKey || '',
      timeout: 5000,
      cacheTimeout: 300000 // 5 minutes
    };
  }

  private setupEventListeners(): void {
    // Listen for game status updates
    this.eventBus.on('game:status', async (event) => {
      try {
        const game = await this.getGame(event.data.gameId);
        if (game) {
          this.eventBus.emit('data:updated', {
            sourceId: 'espn',
            data: [game]
          });
        }
      } catch (error) {
        console.error('Error handling game status update:', error);
      }
    });

    // Listen for player updates
    this.eventBus.on('player:update', async (event) => {
      try {
        const player = await this.getPlayer(event.data.playerId);
        if (player) {
          this.eventBus.emit('data:updated', {
            sourceId: 'espn',
            data: [player]
          });
        }
      } catch (error) {
        console.error('Error handling player update:', error);
      }
    });
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    return `${endpoint}:${params ? JSON.stringify(params) : ''}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.espnConfig.cacheTimeout) {
      return cached.data as T;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public async getGames(params: {
    sport?: string;
    league?: string;
    date?: string;
    status?: 'scheduled' | 'inProgress' | 'final';
  }): Promise<ESPNGame[]> {
    const cacheKey = this.getCacheKey('games', params);
    const cached = this.getCachedData<ESPNGame[]>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get('/games', { params });
    const games = response.data.games as ESPNGame[];
    
    this.setCachedData(cacheKey, games);
    return games;
  }

  public async getGame(gameId: string): Promise<ESPNGame | null> {
    const cacheKey = this.getCacheKey(`game:${gameId}`);
    const cached = this.getCachedData<ESPNGame>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/games/${gameId}`);
    const game = response.data as ESPNGame;
    
    this.setCachedData(cacheKey, game);
    return game;
  }

  public async getPlayers(params: {
    sport?: string;
    league?: string;
    team?: string;
    position?: string;
    status?: string;
  }): Promise<ESPNPlayer[]> {
    const cacheKey = this.getCacheKey('players', params);
    const cached = this.getCachedData<ESPNPlayer[]>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get('/athletes', { params });
    const players = response.data.athletes as ESPNPlayer[];
    
    this.setCachedData(cacheKey, players);
    return players;
  }

  public async getPlayer(playerId: string): Promise<ESPNPlayer | null> {
    const cacheKey = this.getCacheKey(`player:${playerId}`);
    const cached = this.getCachedData<ESPNPlayer>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/athletes/${playerId}`);
    const player = response.data as ESPNPlayer;
    
    this.setCachedData(cacheKey, player);
    return player;
  }

  public async getPlayerStats(playerId: string, params: {
    season?: string;
    seasonType?: 'regular' | 'postseason';
    split?: 'game' | 'season';
  }): Promise<Record<string, number>> {
    const cacheKey = this.getCacheKey(`player:${playerId}:stats`, params);
    const cached = this.getCachedData<Record<string, number>>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/athletes/${playerId}/stats`, { params });
    const stats = response.data.stats as Record<string, number>;
    
    this.setCachedData(cacheKey, stats);
    return stats;
  }

  public async getPlayerProjections(playerId: string, params: {
    season?: string;
    week?: number;
  }): Promise<Record<string, number>> {
    const cacheKey = this.getCacheKey(`player:${playerId}:projections`, params);
    const cached = this.getCachedData<Record<string, number>>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/athletes/${playerId}/projections`, { params });
    const projections = response.data.projections as Record<string, number>;
    
    this.setCachedData(cacheKey, projections);
    return projections;
  }

  public async getHeadlines(params: {
    sport?: string;
    league?: string;
    team?: string;
    player?: string;
    type?: 'news' | 'injury' | 'rumor' | 'analysis';
    limit?: number;
  }): Promise<ESPNHeadline[]> {
    const cacheKey = this.getCacheKey('headlines', params);
    const cached = this.getCachedData<ESPNHeadline[]>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get('/news', { params });
    const headlines = response.data.articles as ESPNHeadline[];
    
    this.setCachedData(cacheKey, headlines);
    return headlines;
  }

  public async getTeamSchedule(teamId: string, params: {
    season?: string;
    seasonType?: 'regular' | 'postseason';
  }): Promise<ESPNGame[]> {
    const cacheKey = this.getCacheKey(`team:${teamId}:schedule`, params);
    const cached = this.getCachedData<ESPNGame[]>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/teams/${teamId}/schedule`, { params });
    const games = response.data.games as ESPNGame[];
    
    this.setCachedData(cacheKey, games);
    return games;
  }

  public async getTeamRoster(teamId: string): Promise<ESPNPlayer[]> {
    const cacheKey = this.getCacheKey(`team:${teamId}:roster`);
    const cached = this.getCachedData<ESPNPlayer[]>(cacheKey);
    if (cached) return cached;

    const response = await this.client.get(`/teams/${teamId}/roster`);
    const players = response.data.athletes as ESPNPlayer[];
    
    this.setCachedData(cacheKey, players);
    return players;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public clearCacheItem(key: string): void {
    this.cache.delete(key);
  }
} 