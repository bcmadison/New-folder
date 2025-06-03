import { DataSource } from '../core/DataSource';
import { EventBus } from '../core/EventBus';
import { PerformanceMonitor } from '../core/PerformanceMonitor';



interface SportsRadarConfig {
  apiKey: string;
  baseUrl: string;
  cacheTimeout: number;
}

export interface SportsRadarData {
  games: {
    id: string;
    status: string;
    scheduled: string;
    home: {
      name: string;
      alias: string;
      statistics: Record<string, number>;
    };
    away: {
      name: string;
      alias: string;
      statistics: Record<string, number>;
    };
    players: Array<{
      id: string;
      name: string;
      team: string;
      position: string;
      statistics: Record<string, number>;
      injuries: Array<{
        type: string;
        status: string;
        startDate: string;
      }>;
    }>;
  }[];
}

export class SportsRadarAdapter implements DataSource<SportsRadarData> {
  public readonly id = 'sports-radar';
  public readonly type = 'sports-data';

  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly config: SportsRadarConfig;
  private cache: {
    data: SportsRadarData | null;
    timestamp: number;
  };

  constructor(config: SportsRadarConfig) {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.config = config;
    this.cache = {
      data: null,
      timestamp: 0
    };
  }

  public async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/status?api_key=${this.config.apiKey}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  public async fetch(): Promise<SportsRadarData> {
    const traceId = this.performanceMonitor.startTrace('sports-radar-fetch');

    try {
      if (this.isCacheValid()) {
        return this.cache.data!;
      }

      const data = await this.fetchSportsRadarData();
      
      this.cache = {
        data,
        timestamp: Date.now()
      };

      this.eventBus.publish({
        type: 'sports-radar-updated',
        payload: { data }
      });

      this.performanceMonitor.endTrace(traceId);
      return data;
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  private async fetchSportsRadarData(): Promise<SportsRadarData> {
    const response = await fetch(
      `${this.config.baseUrl}/games/schedule?api_key=${this.config.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`SportsRadar API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private isCacheValid(): boolean {
    return (
      this.cache.data !== null &&
      Date.now() - this.cache.timestamp < this.config.cacheTimeout
    );
  }

  public clearCache(): void {
    this.cache = {
      data: null,
      timestamp: 0
    };
  }

  public async connect(): Promise<void> {}
  public async disconnect(): Promise<void> {}
  public async getData(): Promise<SportsRadarData> { return this.cache.data as SportsRadarData; }
  public isConnected(): boolean { return true; }
  public getMetadata(): Record<string, unknown> { return { id: this.id, type: this.type }; }
} 