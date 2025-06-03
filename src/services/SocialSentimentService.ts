import { EventBus } from '../core/EventBus';
import { UnifiedConfigManager } from '../core/UnifiedConfig';
import axios, { AxiosInstance } from 'axios';

export interface SocialSentimentConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  cacheTimeout: number;
  platforms: string[];
  batchSize: number;
  refreshInterval: number;
}

export interface SentimentAnalysis {
  id: string;
  source: string;
  platform: string;
  text: string;
  sentiment: {
    score: number;
    magnitude: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  entities: Array<{
    name: string;
    type: string;
    sentiment: number;
    mentions: number;
  }>;
  timestamp: number;
  metadata: {
    followers?: number;
    engagement?: number;
    reach?: number;
    influence?: number;
  };
}

export interface SentimentTrend {
  entityId: string;
  entityType: string;
  timeframe: string;
  dataPoints: Array<{
    timestamp: number;
    sentiment: number;
    volume: number;
  }>;
  summary: {
    averageSentiment: number;
    totalVolume: number;
    dominantSentiment: 'positive' | 'negative' | 'neutral';
    significantChanges: Array<{
      timestamp: number;
      change: number;
      trigger?: string;
    }>;
  };
}

export interface EntityMention {
  id: string;
  name: string;
  type: string;
  mentions: Array<{
    text: string;
    platform: string;
    timestamp: number;
    sentiment: number;
    url?: string;
  }>;
  aggregates: {
    totalMentions: number;
    averageSentiment: number;
    recentTrend: 'rising' | 'falling' | 'stable';
  };
}

export class SocialSentimentService {
  private static instance: SocialSentimentService;
  private readonly eventBus: EventBus;
  private readonly configManager: UnifiedConfigManager;
  private readonly client: AxiosInstance;
  private readonly cache: Map<string, {
    data: any;
    timestamp: number;
  }>;
  private readonly config: SocialSentimentConfig;
  private analysisQueue: Array<{
    text: string;
    platform: string;
    timestamp: number;
  }> = [];
  private isProcessing: boolean = false;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.configManager = UnifiedConfigManager.getInstance();
    this.cache = new Map();
    this.config = this.initializeConfig();
    
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'x-api-key': this.config.apiKey
      }
    });

    this.setupEventListeners();
    this.startProcessingQueue();
  }

  public static getInstance(): SocialSentimentService {
    if (!SocialSentimentService.instance) {
      SocialSentimentService.instance = new SocialSentimentService();
    }
    return SocialSentimentService.instance;
  }

  private initializeConfig(): SocialSentimentConfig {
    const config = this.configManager.getConfig();
    return {
      baseUrl: config.socialSentiment.baseUrl || 'https://api.sentiment-analysis.com/v1',
      apiKey: config.socialSentiment.apiKey || '',
      timeout: 10000,
      cacheTimeout: 300000, // 5 minutes
      platforms: ['twitter', 'reddit', 'youtube'],
      batchSize: 100,
      refreshInterval: 60000 // 1 minute
    };
  }

  private setupEventListeners(): void {
    // Listen for new social media content
    this.eventBus.on('social:content', async (event) => {
      const { text, platform, timestamp } = event.data;
      this.queueForAnalysis(text, platform, timestamp);
    });

    // Listen for entity updates
    this.eventBus.on('entity:update', async (event) => {
      try {
        const { entityId, entityType } = event.data;
        const mentions = await this.getEntityMentions(entityId, entityType);
        if (mentions) {
          this.eventBus.emit('data:updated', {
            sourceId: 'social-sentiment',
            data: [mentions]
          });
        }
      } catch (error) {
        console.error('Error handling entity update:', error);
      }
    });
  }

  private queueForAnalysis(text: string, platform: string, timestamp: number): void {
    this.analysisQueue.push({ text, platform, timestamp });
    
    // Emit metric for queue size
    this.eventBus.emit('metric:recorded', {
      name: 'sentiment_queue_size',
      value: this.analysisQueue.length,
      timestamp: Date.now(),
      labels: {
        platform
      }
    });
  }

  private async startProcessingQueue(): Promise<void> {
    setInterval(async () => {
      if (this.isProcessing || this.analysisQueue.length === 0) return;

      this.isProcessing = true;
      try {
        const batch = this.analysisQueue.splice(0, this.config.batchSize);
        const analyses = await this.analyzeBatch(batch);
        
        if (analyses.length > 0) {
          this.eventBus.emit('data:updated', {
            sourceId: 'social-sentiment',
            data: analyses
          });
        }
      } catch (error) {
        console.error('Error processing sentiment analysis queue:', error);
      } finally {
        this.isProcessing = false;
      }
    }, this.config.refreshInterval);
  }

  private async analyzeBatch(batch: Array<{
    text: string;
    platform: string;
    timestamp: number;
  }>): Promise<SentimentAnalysis[]> {
    const startTime = Date.now();
    try {
      const response = await this.client.post('/analyze/batch', {
        items: batch.map(item => ({
          text: item.text,
          platform: item.platform,
          timestamp: item.timestamp
        }))
      });

      const analyses = response.data.analyses as SentimentAnalysis[];
      
      // Record processing metrics
      this.eventBus.emit('metric:recorded', {
        name: 'sentiment_batch_processing_time',
        value: Date.now() - startTime,
        timestamp: Date.now(),
        labels: {
          batch_size: String(batch.length)
        }
      });

      return analyses;
    } catch (error) {
      console.error('Error analyzing sentiment batch:', error);
      return [];
    }
  }

  public async getSentimentTrend(params: {
    entityId: string;
    entityType: string;
    timeframe: string;
    platform?: string;
  }): Promise<SentimentTrend | null> {
    const cacheKey = this.getCacheKey('trend', params);
    const cached = this.getCachedData<SentimentTrend>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get('/trends', { params });
      const trend = response.data as SentimentTrend;
      
      this.setCachedData(cacheKey, trend);
      return trend;
    } catch (error) {
      console.error('Error fetching sentiment trend:', error);
      return null;
    }
  }

  public async getEntityMentions(entityId: string, entityType: string): Promise<EntityMention | null> {
    const cacheKey = this.getCacheKey(`entity:${entityId}`);
    const cached = this.getCachedData<EntityMention>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.client.get(`/entities/${entityId}`, {
        params: { type: entityType }
      });
      const mentions = response.data as EntityMention;
      
      this.setCachedData(cacheKey, mentions);
      return mentions;
    } catch (error) {
      console.error('Error fetching entity mentions:', error);
      return null;
    }
  }

  public async analyzeSentiment(text: string, platform: string): Promise<SentimentAnalysis | null> {
    try {
      const response = await this.client.post('/analyze', {
        text,
        platform,
        timestamp: Date.now()
      });
      return response.data as SentimentAnalysis;
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return null;
    }
  }

  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    return `${endpoint}:${params ? JSON.stringify(params) : ''}`;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
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

  public clearCache(): void {
    this.cache.clear();
  }

  public clearCacheItem(key: string): void {
    this.cache.delete(key);
  }

  public getQueueSize(): number {
    return this.analysisQueue.length;
  }

  public isQueueProcessing(): boolean {
    return this.isProcessing;
  }
} 