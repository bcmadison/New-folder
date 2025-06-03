// src/core/UnifiedConfig.ts

// import { configService, AppConfig } from '../services/configService'; // For fetching base config
import { SystemError } from './UnifiedError'; // Assuming UnifiedError is in the same directory or correct path
import { configService } from '../services/configService';
import { unifiedMonitor } from './UnifiedMonitor';

/**
 * UnifiedConfig
 *
 * Loads and manages app-wide configuration, including feature flags, experiments, thresholds,
 * and potentially settings for other Unified* engines.
 * This could be a more comprehensive, potentially class-based wrapper around what configService provides,
 * offering typed access and methods for updating or reloading config.
 *
 * Key Responsibilities:
 * 1. Load initial configuration from a backend service (e.g., via configService) or a static file.
 * 2. Provide strongly-typed access to configuration parameters (feature flags, API keys, thresholds, model parameters, etc.).
 * 3. Support dynamic configuration updates (e.g., reloading config from backend without app restart).
 * 4. Manage experiment variants and user segmentation for A/B testing (could integrate with FeatureFlags.ts).
 * 5. Potentially provide methods to update configuration (if an API for this exists and is secure).
 * 6. Serve as the single source of truth for configuration for all other core engines and services.
 * 7. Log configuration loading and update events.
 */

import { FeatureFlags, Experiment, ApiEndpoints, BettingLimits, NotificationPreferences, DataProviderConfig } from '../types'; // Assuming these types are defined in ../types

// Define more specific sub-types if not already in ../types/index.ts
// export interface FeatureFlags { [key: string]: boolean; }
// export interface Experiment { id: string; name: string; variants: string[]; allocation: number[]; isActive: boolean; }
// export interface ApiEndpoints { [serviceName: string]: string; }
// export interface BettingLimits { maxStakeSingle: number; maxStakeParlay: number; maxPayout: number; }
// export interface NotificationPreferences { ... } // Define as needed
// export interface DataProviderConfig { ... } // Define as needed

export interface UnifiedApplicationConfig {
  version: string;
  appName: string;
  environment: 'development' | 'staging' | 'production';
  featureFlags: FeatureFlags;
  experiments: Experiment[];
  apiEndpoints: ApiEndpoints;
  bettingLimits?: BettingLimits;
  notificationPreferences?: NotificationPreferences; // User-specific, maybe not here
  dataProviderConfig?: DataProviderConfig; // Config for data providers if client needs to know
  // Add other global configuration settings
  sentryDsn?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * UnifiedConfig class manages the application-wide configuration.
 * It can be instantiated with a loaded configuration object.
 */
export class UnifiedConfig {
  private static instance: UnifiedConfig;
  private config: UnifiedApplicationConfig;
  private initialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  public static getInstance(): UnifiedConfig {
    if (!UnifiedConfig.instance) {
      UnifiedConfig.instance = new UnifiedConfig();
    }
    return UnifiedConfig.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        const trace = unifiedMonitor.startTrace('UnifiedConfig.initialize', 'config');
        const rawConfig = await configService.fetchAppConfig();
        
        // Validate config structure
        this.validateConfig(rawConfig);
        
        // Deep freeze the config to prevent modifications
        this.config = this.deepFreeze(rawConfig);
        this.initialized = true;
        
        if (trace) {
          unifiedMonitor.endTrace(trace);
        }
        
        console.log('[UnifiedConfig] Initialized successfully with app name:', this.config.appName);
      } catch (error) {
        console.error('[UnifiedConfig] Failed to initialize:', error);
        throw new SystemError('CONFIG_INITIALIZATION_FAILED', 'Failed to initialize UnifiedConfig', error);
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  private validateConfig(config: any): asserts config is UnifiedApplicationConfig {
    const requiredFields = ['version', 'appName', 'environment', 'featureFlags', 'experiments', 'apiEndpoints'];
    
    for (const field of requiredFields) {
      if (!(field in config)) {
        throw new SystemError(
          'INVALID_CONFIG',
          `Missing required field in configuration: ${field}`
        );
      }
    }
  }

  private deepFreeze<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    const frozen = Object.freeze({ ...obj });
    
    Object.keys(frozen).forEach(key => {
      const value = (frozen as any)[key];
      if (typeof value === 'object' && value !== null) {
        (frozen as any)[key] = this.deepFreeze(value);
      }
    });

    return frozen;
  }

  public getConfig(): UnifiedApplicationConfig {
    if (!this.initialized) {
      throw new SystemError(
        'CONFIG_NOT_INITIALIZED',
        'UnifiedConfig must be initialized before use'
      );
    }
    return this.config;
  }

  public getFeatureFlag(key: keyof FeatureFlags): boolean {
    return this.getConfig().featureFlags[key] ?? false;
  }

  public getApiEndpoint(service: keyof ApiEndpoints): string {
    return this.getConfig().apiEndpoints[service];
  }

  public getEnvironment(): string {
    return this.getConfig().environment;
  }

  public getVersion(): string {
    return this.getConfig().version;
  }

  // --- Feature Flag Management ---
  public getAllFeatureFlags(): FeatureFlags {
    return { ...this.config.featureFlags }; // Return a copy
  }

  // --- Experiment Management ---
  public getExperiment(experimentId: string): Experiment | undefined {
    return this.config.experiments.find(exp => exp.id === experimentId);
  }

  public getAllExperiments(): Experiment[] {
    return [...this.config.experiments]; // Return a copy
  }
  
  // --- Betting Limits ---
  public getBettingLimits(): BettingLimits | undefined {
      return this.config.bettingLimits ? { ...this.config.bettingLimits } : undefined;
  }

  // --- Other Config Values ---
  public getSentryDsn(): string | undefined {
      return this.config.sentryDsn;
  }

  public getLogLevel(): 'debug' | 'info' | 'warn' | 'error' | undefined {
      return this.config.logLevel;
  }
  
  // Potentially add methods to update config if it can be dynamic (would require re-instantiation or mutable internal state)
}

// Example of how it might be initialized and used via configService:
// 
// import { configService } from '../services/configService';
// 
// let unifiedConfigInstance: UnifiedConfig | null = null;
// 
// export const getUnifiedConfig = async (): Promise<UnifiedConfig> => {
//   if (unifiedConfigInstance) return unifiedConfigInstance;
//   const rawConfig = await configService.fetchAppConfig(); // fetchAppConfig from configService.ts
//   unifiedConfigInstance = new UnifiedConfig(rawConfig);
//   return unifiedConfigInstance;
// };
// 
// Usage:
// getUnifiedConfig().then(config => {
//   if (config.isFeatureEnabled('newDashboard')) { /* ... */ }
// });

// Singleton instance
// export const unifiedConfig = new UnifiedConfig(); // This was problematic

// Export singleton instance
export const unifiedConfig = UnifiedConfig.getInstance(); 