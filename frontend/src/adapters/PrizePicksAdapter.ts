import {
import { DataSource } from '../core/DataSource';
import { EventBus } from '../core/EventBus';
import { PerformanceMonitor } from '../core/PerformanceMonitor';
import { PrizePicksData, PrizePicksProjection, PrizePicksPlayer, PrizePicksLeague } from '../types/prizePicks';

  PrizePicksAPI,
  RawPrizePicksProjection,
  RawPrizePicksIncludedPlayer,
  RawPrizePicksIncludedLeague,
  PrizePicksIncludedResource,
  PrizePicksAPIResponse
} from '../api/PrizePicksAPI';

interface PrizePicksAdapterConfig {
  apiKey: string; // VITE_PRIZEPICKS_API_KEY
  baseUrl?: string; // Optional: api.prizepicks.com is default in PrizePicksAPI
  cacheTimeout?: number; // Milliseconds, e.g., 5 minutes
  defaultLeagueId?: string; // e.g., NBA league ID for default fetches
}

export class PrizePicksAdapter implements DataSource<PrizePicksData> {
  public readonly id = 'prize-picks';
  public readonly type = 'sports-projections';

  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly prizePicksApi: PrizePicksAPI;
  private readonly config: PrizePicksAdapterConfig;
  private cache: {
    data: PrizePicksData | null;
    timestamp: number;
  };

  constructor(config: PrizePicksAdapterConfig) {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.config = {
        cacheTimeout: 300000, // Default 5 minutes
        ...config,
    };
    this.prizePicksApi = new PrizePicksAPI({
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl || 'https://api.prizepicks.com',
    });
    this.cache = {
      data: null,
      timestamp: 0,
    };
  }

  public async isAvailable(): Promise<boolean> {
    return Boolean(this.config.apiKey);
  }

  public async fetch(): Promise<PrizePicksData> {
    const traceId = this.performanceMonitor.startTrace('prize-picks-adapter-fetch', {
      source: this.id,
      type: this.type,
      leagueId: this.config.defaultLeagueId,
    });

    try {
      if (this.isCacheValid()) {
        this.performanceMonitor.addTraceEvent(traceId, 'cache-hit');
        return this.cache.data!;
      }
      this.performanceMonitor.addTraceEvent(traceId, 'cache-miss');

      const rawApiResponse = await this.prizePicksApi.fetchProjections(this.config.defaultLeagueId);
      
      const transformedData = this.transformData(rawApiResponse);
      
      this.cache = {
        data: transformedData,
        timestamp: Date.now(),
      };

      this.eventBus.emit('data:updated', { 
        sourceId: this.id, 
        timestamp: Date.now(), 
        data: transformedData 
      });
      
      this.performanceMonitor.endTrace(traceId);
      return transformedData;
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      this.eventBus.emit('dataSource:error', { 
        sourceId: this.id, 
        error: error as Error, 
        timestamp: Date.now() 
      });
      throw error;
    }
  }

  private transformData(apiResponse: PrizePicksAPIResponse<RawPrizePicksProjection>): PrizePicksData {
    const includedPlayersMap = new Map<string, PrizePicksPlayer>();
    const includedLeaguesMap = new Map<string, PrizePicksLeague>();

    if (apiResponse.included) {
      apiResponse.included.forEach(item => {
        if (item.type === 'new_player') {
          const rawPlayer = item as RawPrizePicksIncludedPlayer;
          includedPlayersMap.set(rawPlayer.id, {
            id: rawPlayer.id,
            name: rawPlayer.attributes.name,
            team: rawPlayer.attributes.team_name, 
            position: rawPlayer.attributes.position,
          });
        } else if (item.type === 'league') {
          const rawLeague = item as RawPrizePicksIncludedLeague;
          includedLeaguesMap.set(rawLeague.id, {
            id: rawLeague.id,
            name: rawLeague.attributes.name,
            sport: rawLeague.attributes.sport,
          });
        }
      });
    }

    const projections: PrizePicksProjection[] = apiResponse.data.map(rawProj => {
      const playerId = rawProj.relationships.new_player.data.id;
      const playerDetail = includedPlayersMap.get(playerId);

      return {
        id: rawProj.id,
        playerId: playerId,
        player: playerDetail,
        statType: rawProj.attributes.stat_type,
        line: rawProj.attributes.line_score,
        description: rawProj.attributes.description,
        startTime: rawProj.attributes.start_time,
      };
    });

    return {
      projections: projections,
      players: Array.from(includedPlayersMap.values()),
      leagues: Array.from(includedLeaguesMap.values()),
      lastUpdated: new Date().toISOString(),
    };
  }

  private isCacheValid(): boolean {
    if (!this.cache.data) return false;
    const age = Date.now() - this.cache.timestamp;
    return age < (this.config.cacheTimeout || 0);
  }

  public clearCache(): void {
    this.cache = { data: null, timestamp: 0 };
    this.eventBus.emit('cache:cleared', { source: this.id });
  }

  public async connect(): Promise<void> { /* No-op */ }
  public async disconnect(): Promise<void> { /* No-op */ }
  public async getData(): Promise<PrizePicksData | null> { return this.cache.data; }
  public isConnected(): boolean { return true; }
  public getMetadata(): Record<string, any> { 
    return { 
      id: this.id, 
      type: this.type, 
      description: 'Adapter for PrizePicks projection data',
      defaultLeagueId: this.config.defaultLeagueId 
    }; 
  }
} 