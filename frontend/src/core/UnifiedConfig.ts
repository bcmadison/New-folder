import EventEmitter from 'eventemitter3';
import { 
import { EventBus } from './EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';
import { SystemConfig, StrategyConfig } from '../types';

  ConfigUpdate,
  FeatureFlag,
  ExperimentConfig,
  UserSegment,
  ThresholdConfig
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

export interface UnifiedConfig {
  system: SystemConfig;
  strategy: StrategyConfig;
  data: {
    refreshInterval: number;
    cacheTimeout: number;
    retryAttempts: number;
    batchSize: number;
    confidenceThreshold: number;
    maxDataPoints: number;
    streams?: StreamConfig[];
  };
  prediction: {
    minConfidence: number;
    ensembleSize: number;
    adaptiveWeights: boolean;
    learningRate: number;
    decayFactor: number;
    predictionTimeout: number;
  };
}

export interface AppConfig {
  features: FeatureFlag[];
  experiments: ExperimentConfig[];
  thresholds: ThresholdConfig;
  apis: Record<string, ApiConfig>;
  refreshInterval: number;
  cacheTimeout: number;
  environment: 'development' | 'staging' | 'production';
  system: SystemConfig;
  strategy: StrategyConfig;
  data: {
    refreshInterval: number;
    cacheTimeout: number;
    retryAttempts: number;
    batchSize: number;
    confidenceThreshold: number;
    maxDataPoints: number;
    streams?: StreamConfig[];
  };
  prediction: {
    minConfidence: number;
    ensembleSize: number;
    adaptiveWeights: boolean;
    learningRate: number;
    decayFactor: number;
    predictionTimeout: number;
  };
  sentiment: {
    baseUrl: string;
    apiKey: string;
    platforms: string[];
  };
  espn: {
    baseUrl: string;
    apiKey: string;
  };
  risk: {
    maxExposurePercentage: number;
    maxExposurePerCategory: number;
  };
  arbitrage: {
    minProfitMargin: number;
    maxExposure: number;
  };
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  rateLimits: {
    requestsPerSecond: number;
    burstSize: number;
  };
}

export class UnifiedConfigManager {
  private static instance: UnifiedConfigManager;
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private config: AppConfig;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.config = this.getDefaultConfig();
  }

  static getInstance(): UnifiedConfigManager {
    if (!UnifiedConfigManager.instance) {
      UnifiedConfigManager.instance = new UnifiedConfigManager();
    }
    return UnifiedConfigManager.instance;
  }

  private getDefaultConfig(): AppConfig {
    return {
      features: [
        {
          id: 'kelly-criterion',
          name: 'Kelly Criterion Calculator',
          description: 'Advanced bankroll management using Kelly Criterion',
          enabled: true,
          rolloutPercentage: 100
        },
        {
          id: 'arbitrage-scanner',
          name: 'Arbitrage Scanner',
          description: 'Real-time arbitrage opportunity detection',
          enabled: true,
          rolloutPercentage: 100
        },
        {
          id: 'ml-predictions',
          name: 'ML Predictions',
          description: 'Machine learning enhanced predictions',
          enabled: true,
          rolloutPercentage: 100
        }
      ],
      experiments: [
        {
          id: 'new-prop-cards',
          name: 'New Prop Cards Design',
          description: 'Testing new prop cards layout and interactions',
          variants: [
            { id: 'control', name: 'Current Design', weight: 50 },
            { id: 'variant-a', name: 'New Design', weight: 50 }
          ],
          active: true
        }
      ],
      thresholds: {
        minConfidence: 0.65,
        maxRiskPerBet: 0.05,
        maxExposure: 0.2,
        stopLoss: 0.1,
        takeProfit: 0.2,
        kellyMultiplier: 0.5
      },
      apis: {
        prizePicks: {
          baseUrl: 'https://api.prizepicks.com/v1',
          timeout: 10000,
          retryAttempts: 3,
          rateLimits: {
            requestsPerSecond: 10,
            burstSize: 20
          }
        },
        espn: {
          baseUrl: 'https://api.espn.com/v1',
          timeout: 5000,
          retryAttempts: 2,
          rateLimits: {
            requestsPerSecond: 5,
            burstSize: 10
          }
        }
      },
      refreshInterval: 30000,
      cacheTimeout: 300000,
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production',
      system: {
        features: ['kelly-criterion', 'arbitrage-scanner', 'ml-predictions'],
        maxConcurrentRequests: 10,
        cacheTimeout: 300000,
        strategy: 'adaptive',
        performanceMonitoring: {
          enabled: true,
          sampleRate: 0.1,
          retentionPeriod: 86400000
        },
        errorHandling: {
          maxRetries: 3,
          backoffFactor: 1.5,
          timeoutMs: 5000
        },
        eventBus: {
          maxListeners: 100,
          eventTTL: 3600000
        },
        emergencyMode: false,
        emergencyThresholds: {
          errorRate: 0.1,
          latencyMs: 1000,
          memoryUsage: 0.9
        }
      },
      strategy: {
        riskTolerance: 0.5,
        minConfidence: 0.65,
        maxExposure: 0.2,
        hedgingEnabled: true,
        adaptiveStaking: true,
        profitTarget: 0.2,
        stopLoss: 0.1,
        confidenceThreshold: 0.65,
        kellyFraction: 0.5,
        initialBankroll: 10000,
        minStake: 10,
        maxStake: 1000
      },
      data: {
        refreshInterval: 30000,
        cacheTimeout: 300000,
        retryAttempts: 3,
        batchSize: 100,
        confidenceThreshold: 0.65,
        maxDataPoints: 1000,
        streams: [
          {
            id: 'market-data',
            type: 'market',
            source: 'prizepicks',
            interval: 30000,
            retryAttempts: 3,
            timeoutMs: 5000,
            batchSize: 100
          }
        ]
      },
      prediction: {
        minConfidence: 0.65,
        ensembleSize: 5,
        adaptiveWeights: true,
        learningRate: 0.01,
        decayFactor: 0.95,
        predictionTimeout: 5000
      },
      sentiment: {
        baseUrl: 'https://api.sentiment-analysis.com/v1',
        apiKey: process.env.SENTIMENT_API_KEY || '',
        platforms: ['twitter', 'reddit']
      },
      espn: {
        baseUrl: 'https://api.espn.com/v1',
        apiKey: process.env.ESPN_API_KEY || ''
      },
      risk: {
        maxExposurePercentage: 0.2,
        maxExposurePerCategory: 0.1
      },
      arbitrage: {
        minProfitMargin: 0.02,
        maxExposure: 1000
      }
    };
  }

  public async loadConfig(): Promise<void> {
    const traceId = this.performanceMonitor.startTrace('config-load');

    try {
      // Load config from environment variables
      const envConfig = this.loadFromEnv();

      // Merge with default config
      this.config = this.mergeConfigs(this.config, envConfig);

      // Validate config
      this.validateConfig(this.config);

      // Emit config loaded event
      this.eventBus.emit('config:loaded', {
        type: 'config:loaded',
        data: { config: this.config },
        timestamp: Date.now()
      });

      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  private loadFromEnv(): Partial<AppConfig> {
    return {
      features: [
        {
          id: 'kelly-criterion',
          name: 'Kelly Criterion Calculator',
          description: 'Advanced bankroll management using Kelly Criterion',
          enabled: true,
          rolloutPercentage: 100
        },
        {
          id: 'arbitrage-scanner',
          name: 'Arbitrage Scanner',
          description: 'Real-time arbitrage opportunity detection',
          enabled: true,
          rolloutPercentage: 100
        },
        {
          id: 'ml-predictions',
          name: 'ML Predictions',
          description: 'Machine learning enhanced predictions',
          enabled: true,
          rolloutPercentage: 100
        }
      ],
      experiments: [
        {
          id: 'new-prop-cards',
          name: 'New Prop Cards Design',
          description: 'Testing new prop cards layout and interactions',
          variants: [
            { id: 'control', name: 'Current Design', weight: 50 },
            { id: 'variant-a', name: 'New Design', weight: 50 }
          ],
          active: true
        }
      ],
      thresholds: {
        minConfidence: 0.65,
        maxRiskPerBet: 0.05,
        maxExposure: 0.2,
        stopLoss: 0.1,
        takeProfit: 0.2,
        kellyMultiplier: 0.5
      },
      apis: {
        prizePicks: {
          baseUrl: process.env.PRIZEPICKS_API_URL || 'https://api.prizepicks.com/v1',
          timeout: 10000,
          retryAttempts: 3,
          rateLimits: {
            requestsPerSecond: 10,
            burstSize: 20
          }
        },
        espn: {
          baseUrl: process.env.ESPN_API_URL || 'https://api.espn.com/v1',
          timeout: 5000,
          retryAttempts: 2,
          rateLimits: {
            requestsPerSecond: 5,
            burstSize: 10
          }
        }
      },
      refreshInterval: 30000,
      cacheTimeout: 300000,
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production'
    };
  }

  private mergeConfigs(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    return {
      ...base,
      ...override,
      apis: {
        ...base.apis,
        ...override.apis
      },
      system: {
        ...base.system,
        ...override.system
      },
      strategy: {
        ...base.strategy,
        ...override.strategy
      },
      data: {
        ...base.data,
        ...override.data
      },
      prediction: {
        ...base.prediction,
        ...override.prediction
      }
    };
  }

  private validateConfig(config: AppConfig): void {
    // Validate system config
    if (typeof config.system.emergencyMode !== 'boolean') {
      throw new Error('Invalid emergency mode configuration');
    }
    if (config.system.emergencyThresholds.errorRate < 0 || config.system.emergencyThresholds.errorRate > 1) {
      throw new Error('Invalid error rate threshold');
    }
    if (config.system.emergencyThresholds.latencyMs < 0) {
      throw new Error('Invalid latency threshold');
    }

    // Validate strategy config
    if (config.strategy.confidenceThreshold < 0 || config.strategy.confidenceThreshold > 1) {
      throw new Error('Invalid confidence threshold');
    }
    if (config.strategy.riskTolerance < 0 || config.strategy.riskTolerance > 1) {
      throw new Error('Invalid risk tolerance');
    }
    if (config.strategy.maxExposure < 0 || config.strategy.maxExposure > 1) {
      throw new Error('Invalid max exposure');
    }
    if (config.strategy.minConfidence < 0 || config.strategy.minConfidence > 1) {
      throw new Error('Invalid min confidence');
    }
    if (config.strategy.hedgingEnabled && config.strategy.adaptiveStaking) {
      throw new Error('Cannot enable both hedging and adaptive staking');
    }
    if (config.strategy.profitTarget < 0) {
      throw new Error('Invalid profit target');
    }
    if (config.strategy.stopLoss < 0) {
      throw new Error('Invalid stop loss');
    }

    // Validate data config
    if (config.data.refreshInterval < 0) {
      throw new Error('Refresh interval must be non-negative');
    }
    if (config.data.cacheTimeout < 0) {
      throw new Error('Cache timeout must be non-negative');
    }
    if (config.data.retryAttempts < 0) {
      throw new Error('Retry attempts must be non-negative');
    }
    if (config.data.batchSize < 0) {
      throw new Error('Batch size must be non-negative');
    }
    if (config.data.confidenceThreshold < 0 || config.data.confidenceThreshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }
    if (config.data.maxDataPoints < 0) {
      throw new Error('Max data points must be non-negative');
    }

    // Validate prediction config
    if (config.prediction.minConfidence < 0 || config.prediction.minConfidence > 1) {
      throw new Error('Min confidence must be between 0 and 1');
    }
    if (config.prediction.ensembleSize < 1) {
      throw new Error('Ensemble size must be at least 1');
    }
    if (config.prediction.learningRate <= 0 || config.prediction.learningRate > 1) {
      throw new Error('Learning rate must be between 0 and 1');
    }
    if (config.prediction.decayFactor < 0 || config.prediction.decayFactor > 1) {
      throw new Error('Decay factor must be between 0 and 1');
    }
    if (config.prediction.predictionTimeout < 0) {
      throw new Error('Prediction timeout must be non-negative');
    }
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public async updateConfig(update: Partial<AppConfig>): Promise<void> {
    const traceId = this.performanceMonitor.startTrace('config-update');

    try {
      // Merge with current config
      const newConfig = this.mergeConfigs(this.config, update);

      // Validate new config
      this.validateConfig(newConfig);

      // Update config
      this.config = newConfig;

      // Emit config updated event
      this.eventBus.emit('config:updated', {
        type: 'config:updated',
        data: { config: this.config },
        timestamp: Date.now()
      });

      this.performanceMonitor.endTrace(traceId);
    } catch (error) {
      this.performanceMonitor.endTrace(traceId, error as Error);
      throw error;
    }
  }

  public getFeatureFlag(featureId: string): FeatureFlag | undefined {
    return this.config.features.find(f => f.id === featureId);
  }

  public isFeatureEnabled(featureId: string, userId?: string): boolean {
    const feature = this.getFeatureFlag(featureId);
    if (!feature) return false;
    if (!feature.enabled) return false;
    
    if (userId && feature.rolloutPercentage < 100) {
      // Deterministic random number based on userId and featureId
      const hash = this.hashString(`${userId}-${featureId}`);
      return (hash % 100) < feature.rolloutPercentage;
    }
    
    return true;
  }

  public getExperimentVariant(experimentId: string, userId: string): string {
    const experiment = this.config.experiments.find(e => e.id === experimentId);
    if (!experiment || !experiment.active) return 'control';

    const hash = this.hashString(`${userId}-${experimentId}`);
    const normalized = hash % 100;
    
    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (normalized < cumulative) {
        return variant.id;
      }
    }
    
    return experiment.variants[0].id;
  }

  public getThresholds(): ThresholdConfig {
    return this.config.thresholds;
  }

  public getApiConfig(apiId: string): ApiConfig | undefined {
    return this.config.apis[apiId];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
} 