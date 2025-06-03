import { FeatureFlags, Experiment, ApiEndpoints, BettingLimits, NotificationPreferences, DataProviderConfig } from '../types'; // Assuming these types are defined in ../types
import { SystemError } from './UnifiedError'; // Assuming UnifiedError is in the same directory or correct path
import { configService } from '../services/configService';

// src/core/UnifiedConfig.ts

// import { configService, AppConfig } from '../services/configService'; // For fetching base config

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
  private config: UnifiedApplicationConfig;

  constructor(config: UnifiedApplicationConfig) {
    this.config = config;
    Object.freeze(this.config); // Make the loaded config immutable
    Object.freeze(this.config.featureFlags);
    Object.freeze(this.config.apiEndpoints);
    if (this.config.experiments) {
      Object.freeze(this.config.experiments);
    }
    if (this.config.bettingLimits) {
      Object.freeze(this.config.bettingLimits);
    }
    // Freeze other nested objects if necessary
  }

  // --- Getters for various config parts ---
  public getVersion(): string {
    return this.config.version;
  }

  public getAppName(): string {
    return this.config.appName;
  }

  public getEnvironment(): 'development' | 'staging' | 'production' {
    return this.config.environment;
  }

  public getApiEndpoint(serviceName: keyof ApiEndpoints): string | undefined {
    return this.config.apiEndpoints[serviceName];
  }

  // --- Feature Flag Management ---
  public isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
    return !!this.config.featureFlags[flagName]; // Use !! to ensure boolean return
  }

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


let globalUnifiedConfig: UnifiedConfig | null = null;
let globalConfigPromise: Promise<UnifiedConfig> | null = null;

/**
 * Initializes and returns the singleton UnifiedConfig instance.
 * Ensures that the configuration is fetched only once.
 */
export async function initializeUnifiedConfig(): Promise<UnifiedConfig> {
  if (globalUnifiedConfig) {
    return globalUnifiedConfig;
  }
  if (globalConfigPromise) {
    return globalConfigPromise;
  }

  globalConfigPromise = (async () => {
    try {
      const rawConfig = await configService.fetchAppConfig(); // Corrected to use fetchAppConfig
      globalUnifiedConfig = new UnifiedConfig(rawConfig);
      
      return globalUnifiedConfig;
    } catch (error) {
      console.error("CRITICAL: Failed to initialize UnifiedConfig:", error);
      // In a real app, you might want to provide a default/fallback config
      // or prevent the app from starting.
      // For now, throw to make the issue visible.
      throw new Error(`Failed to load application configuration for UnifiedConfig: ${error}`);
    } finally {
      globalConfigPromise = null; // Clear the promise reference once resolved/rejected
    }
  })();
  return globalConfigPromise;
}

/**
 * Gets the initialized UnifiedConfig instance.
 * Throws an error if the config has not been initialized yet via initializeUnifiedConfig().
 * Call this only after initializeUnifiedConfig() has resolved.
 */
export function getInitializedUnifiedConfig(): UnifiedConfig {
  if (!globalUnifiedConfig) {
    // It's better to use a specific error type if available, e.g., from an error utility file
    throw new SystemError('UnifiedConfig accessed before initialization. Ensure initializeUnifiedConfig() is called and awaited at app startup.');
  }
  return globalUnifiedConfig;
}

// It's generally better for modules to await initializeUnifiedConfig()
// or receive the config instance through dependency injection.
// The getInitializedUnifiedConfig() is for convenience where async is hard to manage
// but relies on prior successful initialization. 