import { 
import { EventBus } from './EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PrizePicksApiService, PrizePicksProp } from '../services/unified/PrizePicksApiService';
import { UnifiedConfigManager } from './UnifiedConfig';
import { UnifiedMonitor } from './UnifiedMonitor';

  DataStream, 
  TimestampedData, 
  StreamState, 
  MarketUpdate,
  EventTypes,
  DataSource
} from '../types/core';

interface StreamConfig {
  id: string;
  type: string;
  source: string;
  interval: number;
  retryAttempts: number;
  timeoutMs: number;
  batchSize: number;
}

export interface DataStream<T = TimestampedData> {
  id: string;
  type: string;
  source: string;
  isActive: boolean;
  lastUpdate: number;
  metrics: {
    throughput: number;
    latency: number;
    errorCount: number;
  };
  getLatestData(): T | undefined;
  subscribe(callback: (data: T) => void): () => void;
  unsubscribe(callback: (data: T) => void): void;
}

interface DataSourceConfig {
  id: string;
  type: string;
  url: string;
  pollInterval?: number;
  retryAttempts?: number;
  timeout?: number;
}

interface DataTransformer {
  (data: any): TimestampedData;
}

interface DataState {
  activeStreams: Map<string, DataStream<TimestampedData>>;
  lastUpdate: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: Error;
}

interface ExtendedDataStream extends DataStream {
  confidence: number;
}

class BaseDataStream<T = TimestampedData> implements ExtendedDataStream {
  private data: T[];
  private subscribers: Set<(data: T) => void>;
  private updateInterval: NodeJS.Timeout | null;

  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly source: string,
    private config: StreamConfig
  ) {
    this.data = [];
    this.subscribers = new Set();
    this.updateInterval = null;
  }

  public isActive = false;
  public lastUpdate = 0;
  public metrics = {
    throughput: 0,
    latency: 0,
    errorCount: 0
  };

  public getLatestData(): T | undefined {
    return this.data[this.data.length - 1];
  }

  public subscribe(callback: (data: T) => void): () => void {
    this.subscribers.add(callback);
    return () => this.unsubscribe(callback);
  }

  public unsubscribe(callback: (data: T) => void): void {
    this.subscribers.delete(callback);
  }

  public async start(): Promise<void> {
    if (this.isActive) return;
    this.isActive = true;
    this.updateInterval = setInterval(() => this.update(), this.config.interval);
  }

  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isActive = false;
  }

  public async update(): Promise<void> {
    try {
      const startTime = Date.now();
      const newData = await this.fetchData();
      this.lastUpdate = Date.now();
      
      // Update metrics
      this.metrics.latency = Date.now() - startTime;
      this.metrics.throughput = newData.length;
      
      // Store data and notify subscribers
      this.data = [...this.data.slice(-this.config.batchSize), ...newData];
      this.notifySubscribers();
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  protected async fetchData(): Promise<T[]> {
    // This should be overridden by specific stream implementations
    return [];
  }

  private notifySubscribers(): void {
    const latestData = this.getLatestData();
    if (latestData) {
      this.subscribers.forEach(callback => callback(latestData));
    }
  }
}

export interface DataPoint {
  id: string;
  source: string;
  timestamp: number;
  type: string;
  value: any;
  metadata?: Record<string, any>;
}

export interface DataQuery {
  sources?: string[];
  filters?: Record<string, any>;
  timeRange?: {
    start: number;
    end: number;
  };
  aggregation?: {
    type: 'sum' | 'avg' | 'min' | 'max' | 'count';
    field: string;
    interval?: number;
  };
}

interface DataResult {
  id: string;
  source: string;
  timestamp: number;
  data: Record<string, any>;
  metadata: Record<string, any>;
}

interface MarketData {
  line: number;
  volume: number;
  movement: 'up' | 'down' | 'stable';
}

export class UnifiedDataEngine {
  private static instance: UnifiedDataEngine;
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly monitor: UnifiedMonitor;
  private readonly configManager: UnifiedConfigManager;
  private readonly streams: Map<string, DataStream>;
  private readonly streamConfigs: Map<string, StreamConfig>;
  private readonly dataSources: Map<string, DataSourceConfig>;
  private readonly dataCache: Map<string, TimestampedData[]>;
  private readonly updateIntervals: Map<string, NodeJS.Timeout>;
  private isConnected: boolean = false;
  private readonly CACHE_TTL = 300000; // 5 minutes
  private readonly dataStreams: Map<string, BaseDataStream>;
  private readonly transformers: Map<string, DataTransformer>;
  private state: DataState;
  private readonly marketData: Map<string, MarketData>;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.configManager = UnifiedConfigManager.getInstance();
    this.streams = new Map();
    this.streamConfigs = new Map();
    this.dataSources = new Map();
    this.dataCache = new Map();
    this.updateIntervals = new Map();
    this.dataStreams = new Map();
    this.transformers = new Map();
    this.state = {
      activeStreams: new Map(),
      lastUpdate: Date.now(),
      status: 'idle',
      error: undefined
    };
    this.marketData = new Map();
    this.setupEventListeners();
    this.initializeDataSources();
  }

  static getInstance(): UnifiedDataEngine {
    if (!UnifiedDataEngine.instance) {
      UnifiedDataEngine.instance = new UnifiedDataEngine();
    }
    return UnifiedDataEngine.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    const traceId = this.performanceMonitor.startTrace('data-engine-connect');
    try {
      // Load stream configurations
      const config = this.configManager.getConfig();
      const defaultConfig: StreamConfig = {
        id: 'default',
        type: 'market',
        source: 'default',
        interval: 60000,
        retryAttempts: 3,
        timeoutMs: 5000,
        batchSize: 100
      };

      // Initialize default streams if none configured
      const streamConfigs = config.data?.streams || [defaultConfig];
      for (const streamConfig of streamConfigs) {
        this.streamConfigs.set(streamConfig.id, streamConfig);
      }

      // Initialize streams
      for (const [id, config] of this.streamConfigs) {
        await this.createStream(config);
      }

      this.isConnected = true;
      this.performanceMonitor.endTrace(traceId);

      // Emit config loaded event
      this.eventBus.emit('config:loaded', {
        config
      });
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    // Stop all streams
    for (const stream of this.streams.values()) {
      if (stream instanceof BaseDataStream) {
        stream.stop();
      }
    }

    this.streams.clear();
    this.isConnected = false;
  }

  public async createStream(config: StreamConfig): Promise<DataStream> {
    const stream = new BaseDataStream(config.id, config.type, config.source, config);
    this.streams.set(config.id, stream);
    
    if (this.isConnected) {
      await (stream as BaseDataStream).start();
    }

    return stream;
  }

  public getStream(id: string): DataStream | undefined {
    return this.streams.get(id);
  }

  public getAllStreams(): Map<string, DataStream> {
    return new Map(this.streams);
  }

  public async handleMarketUpdate(update: MarketUpdate): Promise<void> {
    const streamId = this.getStreamIdForMarket(update);
    const stream = this.streams.get(streamId);

    if (stream) {
      await this.processUpdate(stream, update);
    }
  }

  private getStreamIdForMarket(update: MarketUpdate): string {
    return `market:${update.id}`;
  }

  private async processUpdate(stream: DataStream, update: MarketUpdate): Promise<void> {
    const startTime = Date.now();
    try {
      // Process the update
      if (stream instanceof BaseDataStream) {
        await stream.update();
      }

      // Emit metrics
      this.eventBus.emit('metric:recorded', {
        name: 'stream_update',
        value: Date.now() - startTime,
        timestamp: Date.now(),
        labels: {
          stream_id: stream.id,
          type: stream.type,
          source: stream.source
        }
      });
    } catch (error) {
      this.monitor.logError('data', error as Error, {
        stream_id: stream.id,
        update
      });
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.eventBus.on('market:update', async (event) => {
      try {
        await this.handleMarketUpdate(event.data);
      } catch (error) {
        this.monitor.logError('data', error as Error, { update: event.data });
      }
    });

    // Monitor stream health
    setInterval(() => {
      for (const [id, stream] of this.streams) {
        const state: StreamState = {
          id: stream.id,
          type: stream.type,
          source: stream.source,
          isActive: stream.isActive,
          lastUpdate: stream.lastUpdate,
          metrics: stream.metrics
        };

        this.eventBus.emit('metric:recorded', {
          name: 'stream_health',
          value: stream.metrics.errorCount,
          timestamp: Date.now(),
          labels: {
            stream_id: id,
            active: String(stream.isActive),
            throughput: String(stream.metrics.throughput)
          }
        });
      }
    }, 60000); // Monitor every minute

    this.eventBus.on('config:updated', (data: EventTypes['config:updated']) => {
      this.refreshDataSources();
    });

    this.eventBus.on('dataSource:error', (data: EventTypes['dataSource:error']) => {
      this.handleDataSourceError(data.error);
    });

    this.eventBus.on('market:update', (update: MarketUpdate) => {
      const key = `${update.data.playerId}:${update.data.metric}`;
      this.marketData.set(key, {
        line: update.data.value,
        volume: update.data.volume || 0,
        movement: update.data.movement || 'stable'
      });
    });
  }

  private initializeDataSources(): void {
    // Initialize PrizePicks data source
    this.registerDataSource({
      id: 'prizepicks',
      name: 'PrizePicks',
      type: 'api',
      config: {
        baseUrl: process.env.PRIZEPICKS_BASE_URL,
        rateLimit: parseInt(process.env.PRIZEPICKS_RATE_LIMIT || '60'),
        timeout: 30000
      },
      status: 'inactive'
    });

    // Initialize ESPN data source
    this.registerDataSource({
      id: 'espn',
      name: 'ESPN',
      type: 'api',
      config: {
        baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
        rateLimit: 60,
        timeout: 30000
      },
      status: 'inactive'
    });

    // Initialize TheOdds data source
    this.registerDataSource({
      id: 'theodds',
      name: 'TheOdds',
      type: 'api',
      config: {
        baseUrl: 'https://api.theoddsapi.com/v4',
        apiKey: process.env.VITE_THEODDS_API_KEY,
        rateLimit: 60,
        timeout: 30000
      },
      status: 'inactive'
    });

    // Initialize SportsRadar data source
    this.registerDataSource({
      id: 'sportradar',
      name: 'SportsRadar',
      type: 'api',
      config: {
        baseUrl: 'https://api.sportradar.us/odds/v4/sports',
        apiKey: process.env.VITE_SPORTS_RADAR_API_KEY,
        rateLimit: 60,
        timeout: 30000
      },
      status: 'inactive'
    });

    // Initialize WebSocket data source
    this.registerDataSource({
      id: 'realtime',
      name: 'Real-time Updates',
      type: 'websocket',
      config: {
        url: process.env.VITE_WS_URL,
        reconnectAttempts: 5,
        reconnectDelay: 1000
      },
      status: 'inactive'
    });

    this.activateDataSources();
  }

  private async activateDataSources(): Promise<void> {
    for (const source of this.dataSources.values()) {
      try {
        await this.activateDataSource(source);
      } catch (error) {
        this.performanceMonitor.recordError(error, {
          context: 'data_source_activation',
          source: source.id
        });
      }
    }
  }

  private async activateDataSource(source: DataSource): Promise<void> {
    const trace = this.performanceMonitor.startTrace('data_source_activation');
    try {
      // Implement source-specific activation logic
      switch (source.type) {
        case 'api':
          await this.validateApiConnection(source);
          break;
        case 'websocket':
          await this.initializeWebSocket(source);
          break;
        case 'file':
          await this.validateFileAccess(source);
          break;
      }

      source.status = 'active';
      source.lastUpdate = Date.now();
      this.dataSources.set(source.id, source);

      this.eventBus.emit('dataSource:registered', {
        sourceId: source.id,
        name: source.name,
        timestamp: Date.now()
      });
    } catch (error) {
      source.status = 'error';
      source.error = error;
      this.dataSources.set(source.id, source);

      this.eventBus.emit('dataSource:error', {
        sourceId: source.id,
        error,
        timestamp: Date.now()
      } as EventTypes['dataSource:error']);

      throw error;
    } finally {
      trace.end();
    }
  }

  private async validateApiConnection(source: DataSource): Promise<void> {
    // Implement API connection validation
  }

  private async initializeWebSocket(source: DataSource): Promise<void> {
    // Implement WebSocket initialization
  }

  private async validateFileAccess(source: DataSource): Promise<void> {
    // Implement file access validation
  }

  public async queryData(query: DataQuery): Promise<DataResult[]> {
    const trace = this.performanceMonitor.startTrace('data_query');
    try {
      let results: DataResult[] = [];

      // Determine which sources to query
      const sources = query.sources
        ? query.sources.map(id => this.dataSources.get(id)!).filter(s => s)
        : Array.from(this.dataSources.values());

      // Query each source
      for (const source of sources) {
        if (source.status !== 'active') continue;

        const sourceData = await this.querySource(source, query);
        results = results.concat(sourceData);
      }

      // Apply filters
      if (query.filters) {
        results = this.applyFilters(results, query.filters);
      }

      // Apply time range filter
      if (query.timeRange) {
        results = this.applyTimeRange(results, query.timeRange);
      }

      // Apply aggregation
      if (query.aggregation) {
        results = this.applyAggregation(results, query.aggregation);
      }

      return results;
    } catch (error) {
      this.performanceMonitor.recordError(error, { context: 'data_query', query });
      throw error;
    } finally {
      trace.end();
    }
  }

  private async querySource(
    source: DataSource,
    query: DataQuery
  ): Promise<DataResult[]> {
    const cacheKey = this.generateCacheKey(source.id, query);
    const cachedData = this.getCachedData(cacheKey);

    if (cachedData) {
      return cachedData.map(data => ({
        id: `${source.id}-${data.id}`,
        source: source.id,
        timestamp: data.timestamp,
        data: data.data,
        metadata: data.metadata
      }));
    }

    const results = await this.fetchSourceData(source, query);
    this.cacheData(cacheKey, results);

    return results;
  }

  private async fetchSourceData(
    source: DataSource,
    query: DataQuery
  ): Promise<DataResult[]> {
    // Implement source-specific data fetching logic
    switch (source.type) {
      case 'api':
        return this.fetchApiData(source, query);
      case 'websocket':
        return this.fetchWebSocketData(source, query);
      case 'file':
        return this.fetchFileData(source, query);
      default:
        throw new Error(`Unsupported data source type: ${source.type}`);
    }
  }

  private async fetchApiData(
    source: DataSource,
    query: DataQuery
  ): Promise<DataResult[]> {
    // Implement API-specific data fetching
    return [];
  }

  private async fetchWebSocketData(
    source: DataSource,
    query: DataQuery
  ): Promise<DataResult[]> {
    // Implement WebSocket data fetching
    return [];
  }

  private async fetchFileData(
    source: DataSource,
    query: DataQuery
  ): Promise<DataResult[]> {
    // Implement file data fetching
    return [];
  }

  private applyFilters(
    results: DataResult[],
    filters: Record<string, any>
  ): DataResult[] {
    return results.filter(result => {
      return Object.entries(filters).every(([key, value]) => {
        const fieldValue = result.data[key];
        if (typeof value === 'function') {
          return value(fieldValue);
        }
        return fieldValue === value;
      });
    });
  }

  private applyTimeRange(
    results: DataResult[],
    timeRange: { start: number; end: number }
  ): DataResult[] {
    return results.filter(result =>
      result.timestamp >= timeRange.start && result.timestamp <= timeRange.end
    );
  }

  private applyAggregation(
    results: DataResult[],
    aggregation: {
      type: 'sum' | 'avg' | 'min' | 'max' | 'count';
      field: string;
      interval?: number;
    }
  ): DataResult[] {
    if (aggregation.interval) {
      // Group results by time interval
      const groups = new Map<number, DataResult[]>();
      results.forEach(result => {
        const interval = Math.floor(result.timestamp / aggregation.interval!);
        if (!groups.has(interval)) {
          groups.set(interval, []);
        }
        groups.get(interval)!.push(result);
      });

      // Apply aggregation to each group
      return Array.from(groups.entries()).map(([interval, group]) => ({
        id: `agg-${interval}`,
        source: 'aggregation',
        timestamp: interval * aggregation.interval!,
        data: {
          [aggregation.field]: this.calculateAggregation(
            group.map(r => r.data[aggregation.field]),
            aggregation.type
          )
        },
        metadata: {
          aggregationType: aggregation.type,
          interval: aggregation.interval,
          count: group.length
        }
      }));
    }

    // Apply aggregation to all results
    return [{
      id: 'agg-all',
      source: 'aggregation',
      timestamp: Date.now(),
      data: {
        [aggregation.field]: this.calculateAggregation(
          results.map(r => r.data[aggregation.field]),
          aggregation.type
        )
      },
      metadata: {
        aggregationType: aggregation.type,
        count: results.length
      }
    }];
  }

  private calculateAggregation(values: number[], type: string): number {
    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        throw new Error(`Unsupported aggregation type: ${type}`);
    }
  }

  private generateCacheKey(sourceId: string, query: DataQuery): string {
    return `${sourceId}:${JSON.stringify(query)}`;
  }

  private getCachedData(key: string): TimestampedData[] | undefined {
    const cached = this.dataCache.get(key);
    if (cached && Date.now() - cached[0].timestamp < this.CACHE_TTL) {
      return cached;
    }
    return undefined;
  }

  private cacheData(key: string, data: DataResult[]): void {
    const timestampedData: TimestampedData[] = data.map(result => ({
      id: result.id,
      timestamp: result.timestamp,
      value: 0, // Default value
      data: result.data,
      metadata: result.metadata
    }));

    this.dataCache.set(key, timestampedData);
  }

  private updateCache(key: string, data: TimestampedData): void {
    const cached = this.dataCache.get(key) || [];
    cached.push(data);

    // Remove old data
    const cutoff = Date.now() - this.CACHE_TTL;
    const filtered = cached.filter(d => d.timestamp >= cutoff);

    this.dataCache.set(key, filtered);
  }

  public registerDataSource(source: DataSourceConfig): void {
    this.dataSources.set(source.id, {
      ...source,
      pollInterval: source.pollInterval || 5000,
      retryAttempts: source.retryAttempts || 3,
      timeout: source.timeout || 10000
    });

    this.initializeDataStream(source);
  }

  public registerTransformer(sourceId: string, transformer: DataTransformer): void {
    this.transformers.set(sourceId, transformer);
  }

  private async initializeDataStream(config: DataSourceConfig): Promise<void> {
    try {
      const stream = this.createDataStream(config);
      this.dataStreams.set(config.id, stream);
      this.state.activeStreams.set(config.id, stream);
      this.state.lastUpdate = Date.now();
      
      this.eventBus.emit('dataSource:registered', {
        sourceId: config.id,
        name: config.type,
        timestamp: Date.now()
      } as EventTypes['dataSource:registered']);
    } catch (error) {
      this.handleDataSourceError(error as Error);
    }
  }

  private createDataStream(config: DataSourceConfig): BaseDataStream {
    const streamState: StreamState = {
      id: config.id,
      type: config.type,
      source: config.url,
      isActive: true,
      lastUpdate: Date.now(),
      metrics: {
        throughput: 0,
        latency: 0,
        errorCount: 0
      }
    };

    let latestData: TimestampedData | undefined;
    const subscribers = new Set<(data: TimestampedData) => void>();

    const stream: BaseDataStream = {
      id: config.id,
      type: config.type,
      source: config.url,
      isActive: true,
      lastUpdate: Date.now(),
      confidence: 1,
      metrics: streamState.metrics,
      getLatestData: () => latestData,
      subscribe: (callback: (data: TimestampedData) => void) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      },
      unsubscribe: (callback: (data: TimestampedData) => void) => {
        subscribers.delete(callback);
      }
    };

    this.startPolling(config, stream, (data: TimestampedData) => {
      latestData = data;
      subscribers.forEach(callback => callback(data));
    });

    return stream;
  }

  private async startPolling(
    config: DataSourceConfig,
    stream: BaseDataStream,
    onData: (data: TimestampedData) => void
  ): Promise<void> {
    const poll = async () => {
      try {
        const startTime = Date.now();
        const response = await this.fetchData(config);
        const transformer = this.transformers.get(config.id);
        
        if (transformer) {
          const transformedData = transformer(response);
          onData(transformedData);
          
          // Update metrics
          stream.metrics.latency = Date.now() - startTime;
          stream.metrics.throughput++;
          stream.lastUpdate = Date.now();
          
          this.eventBus.emit('data:updated', {
            sourceId: config.id,
            timestamp: Date.now(),
            data: transformedData
          } as EventTypes['data:updated']);

          // Emit market update if applicable
          if (this.isMarketData(transformedData)) {
            const marketUpdate: MarketUpdate = {
              id: `market_${Date.now()}`,
              type: 'market_update',
              timestamp: Date.now(),
              data: {
                playerId: transformedData.id,
                metric: transformedData.type,
                value: transformedData.value,
                volume: transformedData.data.volume,
                movement: transformedData.data.movement
              },
              metadata: transformedData.metadata
            };
            this.eventBus.emit('market:update', marketUpdate);
          }
        }
      } catch (error) {
        stream.metrics.errorCount++;
        this.handleDataSourceError(error as Error);
      }
    };

    // Initial poll
    await poll();

    // Continue polling if interval is specified
    if (config.pollInterval) {
      setInterval(poll, config.pollInterval);
    }
  }

  private async fetchData(config: DataSourceConfig): Promise<any> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < (config.retryAttempts || 3)) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(config.url, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    throw lastError || new Error('Failed to fetch data after multiple attempts');
  }

  private isMarketData(data: TimestampedData): boolean {
    return (
      typeof data.id === 'string' &&
      typeof data.type === 'string' &&
      typeof data.value === 'number' &&
      typeof data.data === 'object' &&
      data.data !== null &&
      ('volume' in data.data || 'movement' in data.data)
    );
  }

  private handleDataSourceError(error: Error): void {
    this.state.error = error;
    this.state.status = 'error';
    
    this.monitor.logError('data_engine', error, {
      timestamp: Date.now(),
      activeStreams: Array.from(this.state.activeStreams.keys())
    });

    this.eventBus.emit('dataSource:error', {
      sourceId: 'unknown',
      error,
      timestamp: Date.now()
    } as EventTypes['dataSource:error']);
  }

  public getDataStream(sourceId: string): ExtendedDataStream | undefined {
    return this.dataStreams.get(sourceId);
  }

  public getAllDataStreams(): ExtendedDataStream[] {
    return Array.from(this.dataStreams.values());
  }

  public getStreamState(sourceId: string): StreamState | undefined {
    const stream = this.dataStreams.get(sourceId);
    if (!stream) return undefined;

    return {
      id: stream.id,
      type: stream.type,
      source: stream.source,
      isActive: stream.isActive,
      lastUpdate: stream.lastUpdate,
      metrics: stream.metrics
    };
  }

  private async refreshDataSources(): Promise<void> {
    // Stop all existing streams
    this.dataStreams.forEach(stream => {
      stream.isActive = false;
    });
    this.dataStreams.clear();
    this.state.activeStreams.clear();

    // Reinitialize with current config
    for (const config of this.dataSources.values()) {
      await this.initializeDataStream(config);
    }
  }

  public getState(): DataState {
    return { ...this.state };
  }

  public async getMarketData(propId: string): Promise<MarketData> {
    const data = this.marketData.get(propId);
    if (!data) {
      return {
        line: 0,
        volume: 0,
        movement: 'stable'
      };
    }
    return data;
  }

  public async getHistoricalData(propId: string, timeframe: string): Promise<TimestampedData[]> {
    const traceId = this.performanceMonitor.startTrace('get-historical-data');
    try {
      // Implementation for fetching historical data
      const data: TimestampedData[] = [];
      this.performanceMonitor.endTrace(traceId);
      return data;
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  public async startStream(streamId: string): Promise<void> {
    const stream = this.dataStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }
    await stream.start();
  }

  public async stopStream(streamId: string): Promise<void> {
    const stream = this.dataStreams.get(streamId);
    if (!stream) {
      throw new Error(`Stream ${streamId} not found`);
    }
    await stream.stop();
  }
} 