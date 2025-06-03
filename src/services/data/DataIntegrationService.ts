import { Subject, Observable } from 'rxjs';
import { apiService } from '../api/apiService';

interface DataStream {
  type: 'odds' | 'stats' | 'injuries' | 'news';
  data: any;
  timestamp: number;
}

interface DataCache {
  [key: string]: {
    data: any;
    timestamp: number;
    ttl: number;
  };
}

class DataIntegrationService {
  private dataStreams: Map<string, Subject<DataStream>> = new Map();
  private cache: DataCache = {};
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeStreams();
  }

  private initializeStreams() {
    // Initialize data streams
    ['odds', 'stats', 'injuries', 'news'].forEach(streamType => {
      this.dataStreams.set(streamType, new Subject<DataStream>());
    });

    // Subscribe to API service's WebSocket stream
    apiService.getDataStream().subscribe({
      next: (data) => this.handleWebSocketData(data),
      error: (error) => console.error('WebSocket stream error:', error)
    });
  }

  public startAllStreams() {
    // Start periodic data updates
    this.startPeriodicUpdate('stats', 60000); // Update stats every minute
    this.startPeriodicUpdate('odds', 30000);  // Update odds every 30 seconds
    this.startPeriodicUpdate('injuries', 300000); // Update injuries every 5 minutes
    this.startPeriodicUpdate('news', 300000);    // Update news every 5 minutes
  }

  private startPeriodicUpdate(type: string, interval: number) {
    // Clear existing interval if any
    if (this.updateIntervals.has(type)) {
      clearInterval(this.updateIntervals.get(type));
    }

    // Set new interval
    const intervalId = setInterval(async () => {
      try {
        await this.fetchAndUpdateData(type);
      } catch (error) {
        console.error(`Error updating ${type} data:`, error);
      }
    }, interval);

    this.updateIntervals.set(type, intervalId);
  }

  private async fetchAndUpdateData(type: string) {
    let data;
    switch (type) {
      case 'stats':
        data = await apiService.fetchPlayerStats('all');
        break;
      case 'odds':
        data = await apiService.fetchGameOdds('all');
        break;
      case 'injuries':
        data = await apiService.fetchInjuryReports();
        break;
      case 'news':
        data = await apiService.fetchNews();
        break;
      default:
        throw new Error(`Unknown data type: ${type}`);
    }

    if (data.success) {
      this.updateCache(type, data.data);
      this.emitUpdate(type, data.data);
    }
  }

  private handleWebSocketData(data: any) {
    const stream = this.dataStreams.get(data.type);
    if (stream) {
      stream.next({
        type: data.type,
        data: data.payload,
        timestamp: Date.now()
      });
    }
  }

  private updateCache(key: string, data: any, ttl: number = this.DEFAULT_CACHE_TTL) {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    };
  }

  public getCachedData(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  public getStream(type: string): Observable<DataStream> {
    const stream = this.dataStreams.get(type);
    if (!stream) {
      throw new Error(`Stream not found for type: ${type}`);
    }
    return stream.asObservable();
  }

  private emitUpdate(type: string, data: any) {
    const stream = this.dataStreams.get(type);
    if (stream) {
      stream.next({
        type: type as any,
        data,
        timestamp: Date.now()
      });
    }
  }

  public async getHistoricalData(options: {
    startDate: string;
    endDate: string;
    type: string;
  }): Promise<any[]> {
    const cacheKey = `historical_${options.type}_${options.startDate}_${options.endDate}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const response = await apiService.fetchHistoricalData(options);
    if (response.success) {
      this.updateCache(cacheKey, response.data, 24 * 60 * 60 * 1000); // Cache for 24 hours
      return response.data;
    }

    throw new Error(`Failed to fetch historical data: ${response.error}`);
  }

  public stopAllStreams() {
    // Clear all update intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();

    // Complete all subjects
    this.dataStreams.forEach(stream => stream.complete());
    this.dataStreams.clear();
  }
}

export const dataIntegrationService = new DataIntegrationService(); 