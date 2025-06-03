import EventEmitter from 'eventemitter3';
import axios, { AxiosInstance } from 'axios';
import { io, Socket } from 'socket.io-client';
import { z } from 'zod';



// Data source types
export enum DataSource {
  PRIZEPICKS = 'prizepicks',
  ESPN = 'espn',
  ODDS_API = 'odds_api',
}

// Unified response schema
const DataResponseSchema = z.object({
  source: z.nativeEnum(DataSource),
  timestamp: z.number(),
  data: z.unknown(),
  status: z.enum(['success', 'error']),
});

type DataResponse = z.infer<typeof DataResponseSchema>;

export class UnifiedDataService extends EventEmitter {
  private static instance: UnifiedDataService;
  private apiClients: Map<DataSource, AxiosInstance>;
  private wsConnections: Map<DataSource, Socket>;
  private cache: Map<string, { data: any; timestamp: number }>;

  private constructor() {
    super();
    this.apiClients = new Map();
    this.wsConnections = new Map();
    this.cache = new Map();
    this.initializeClients();
  }

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  private initializeClients() {
    // Initialize API clients
    Object.values(DataSource).forEach(source => {
      this.apiClients.set(source, axios.create({
        baseURL: this.getBaseUrl(source),
        timeout: 10000,
      }));
    });
  }

  private getBaseUrl(source: DataSource): string {
    // Configure base URLs for different data sources
    const urls = {
      [DataSource.PRIZEPICKS]: process.env.PRIZEPICKS_API_URL,
      [DataSource.ESPN]: process.env.ESPN_API_URL,
      [DataSource.ODDS_API]: process.env.ODDS_API_URL,
    };
    return urls[source] || '';
  }

  async fetchData(source: DataSource, endpoint: string, params?: any): Promise<DataResponse> {
    const cacheKey = `${source}:${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data if it's less than 30 seconds old
    if (cached && Date.now() - cached.timestamp < 30000) {
      return {
        source,
        timestamp: cached.timestamp,
        data: cached.data,
        status: 'success',
      };
    }

    try {
      const client = this.apiClients.get(source);
      if (!client) throw new Error(`No client found for source: ${source}`);

      const response = await client.get(endpoint, { params });
      
      // Cache the response
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return {
        source,
        timestamp: Date.now(),
        data: response.data,
        status: 'success',
      };
    } catch (error) {
      this.emit('error', { source, error });
      return {
        source,
        timestamp: Date.now(),
        data: null,
        status: 'error',
      };
    }
  }

  connectWebSocket(source: DataSource, options: { events: string[] }) {
    if (this.wsConnections.has(source)) return;

    const socket = io(this.getBaseUrl(source), {
      transports: ['websocket'],
      autoConnect: true,
    });

    options.events.forEach(event => {
      socket.on(event, (data) => {
        this.emit(`ws:${source}:${event}`, data);
      });
    });

    socket.on('connect_error', (error) => {
      this.emit('ws:error', { source, error });
    });

    this.wsConnections.set(source, socket);
  }

  disconnectWebSocket(source: DataSource) {
    const socket = this.wsConnections.get(source);
    if (socket) {
      socket.disconnect();
      this.wsConnections.delete(source);
    }
  }

  clearCache() {
    this.cache.clear();
  }
} 