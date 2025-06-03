import { EventBus } from './EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';
import { UnifiedConfigManager } from './UnifiedConfig';
import { UnifiedMonitor } from './UnifiedMonitor';
import { unifiedMonitor } from '@/core/UnifiedMonitor';

export type ErrorCode =
  | 'INITIALIZATION_FAILED'
  | 'CONFIG_INITIALIZATION_FAILED'
  | 'INVALID_CONFIG'
  | 'CONFIG_NOT_INITIALIZED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'UNKNOWN_ERROR'
  | 'STATE_INITIALIZATION_FAILED'
  | 'STATE_NOT_INITIALIZED';

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  originalError?: Error;
  timestamp: number;
  component?: string;
  action?: string;
}

export class SystemError extends Error {
  public readonly code: ErrorCode;
  public readonly details: Record<string, any>;
  public readonly timestamp: number;
  public readonly component?: string;
  public readonly action?: string;
  private readonly originalError?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    originalError?: Error,
    context?: Partial<ErrorContext>
  ) {
    super(message);
    this.name = 'SystemError';
    this.code = code;
    this.details = context?.details || {};
    this.timestamp = Date.now();
    this.component = context?.component;
    this.action = context?.action;
    this.originalError = originalError;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, SystemError.prototype);

    // Track error in monitoring system
    this.trackError();
  }

  private trackError(): void {
    const errorContext: ErrorContext = {
      code: this.code,
      message: this.message,
      details: this.details,
      originalError: this.originalError,
      timestamp: this.timestamp,
      component: this.component,
      action: this.action
    };

    unifiedMonitor.reportError(this, errorContext);
  }

  public toJSON(): ErrorContext {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      component: this.component,
      action: this.action
    };
  }

  public static fromError(error: Error, code: ErrorCode = 'UNKNOWN_ERROR'): SystemError {
    if (error instanceof SystemError) {
      return error;
    }

    return new SystemError(
      code,
      error.message,
      error,
      {
        details: {
          originalError: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        }
      }
    );
  }

  public static isSystemError(error: any): error is SystemError {
    return error instanceof SystemError;
  }
}

// Error factory functions for common error types
export const createApiError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('API_ERROR', message, undefined, { details });
};

export const createValidationError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('VALIDATION_ERROR', message, undefined, { details });
};

export const createAuthError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('AUTHENTICATION_ERROR', message, undefined, { details });
};

export const createNotFoundError = (message: string, details?: Record<string, any>): SystemError => {
  return new SystemError('RESOURCE_NOT_FOUND', message, undefined, { details });
};

export interface BettingSystemError extends Error {
  code: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  timestamp: number;
  retryable: boolean;
}

interface ErrorMetrics {
  count: number;
  lastOccurrence: number;
  meanTimeBetweenErrors: number;
  recoveryRate: number;
  meanTimeToRecovery: number;
}

interface ErrorRecoveryStrategy {
  maxRetries: number;
  backoffFactor: number;
  timeout: number;
  recoveryActions: Array<(error: BettingSystemError) => Promise<void>>;
}

export class UnifiedErrorHandler {
  private static instance: UnifiedErrorHandler;
  private readonly eventBus: EventBus;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly monitor: UnifiedMonitor;
  private readonly configManager: UnifiedConfigManager;
  private readonly errorMetrics: Map<string, ErrorMetrics>;
  private readonly recoveryStrategies: Map<string, ErrorRecoveryStrategy>;
  private readonly errorHistory: BettingSystemError[];
  private readonly MAX_ERROR_HISTORY = 1000;
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly DEFAULT_BACKOFF_FACTOR = 1.5;
  private readonly DEFAULT_TIMEOUT = 5000;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.monitor = UnifiedMonitor.getInstance();
    this.configManager = UnifiedConfigManager.getInstance();
    this.errorMetrics = new Map();
    this.recoveryStrategies = new Map();
    this.errorHistory = [];
    
    this.initializeRecoveryStrategies();
    this.setupEventListeners();
  }

  static getInstance(): UnifiedErrorHandler {
    if (!UnifiedErrorHandler.instance) {
      UnifiedErrorHandler.instance = new UnifiedErrorHandler();
    }
    return UnifiedErrorHandler.instance;
  }

  public async handleError(error: Error | BettingSystemError, context?: Record<string, any>): Promise<void> {
    const traceId = this.performanceMonitor.startTrace('error-handling');

    try {
      const systemError = this.normalizeError(error, context);
      this.recordError(systemError);

      // Check if we should attempt recovery
      if (systemError.retryable) {
        await this.attemptRecovery(systemError);
      }

      // Emit error event
      this.eventBus.emit('error', systemError);

      // Update metrics
      this.updateErrorMetrics(systemError);

      // Check if we need to trigger emergency procedures
      if (this.shouldTriggerEmergency(systemError)) {
        await this.triggerEmergencyProcedures(systemError);
      }

      this.performanceMonitor.endTrace(traceId);
    } catch (handlingError) {
      this.performanceMonitor.endTrace(traceId, handlingError as Error);
      // If error handling fails, emit a critical system alert
      this.monitor.logError('error-handler', handlingError as Error, {
        originalError: error,
        context: 'error_handling_failure'
      });
    }
  }

  private normalizeError(error: Error | BettingSystemError, context?: Record<string, any>): BettingSystemError {
    if (this.isBettingSystemError(error)) {
      return error;
    }

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: 'UNKNOWN_ERROR',
      component: context?.component || 'system',
      severity: 'medium',
      context: context || {},
      timestamp: Date.now(),
      retryable: true
    } as BettingSystemError;
  }

  private isBettingSystemError(error: Error | BettingSystemError): error is BettingSystemError {
    return 'code' in error && 'component' in error && 'severity' in error;
  }

  private recordError(error: BettingSystemError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory.pop();
    }
  }

  private async attemptRecovery(error: BettingSystemError): Promise<void> {
    const strategy = this.recoveryStrategies.get(error.component);
    if (!strategy) return;

    const traceId = this.performanceMonitor.startTrace('error-recovery');
    let attempt = 0;
    let delay = strategy.timeout;

    try {
      while (attempt < strategy.maxRetries) {
        try {
          for (const action of strategy.recoveryActions) {
            await action(error);
          }
          // Recovery successful
          this.updateRecoveryMetrics(error, attempt);
          return;
        } catch (recoveryError) {
          attempt++;
          if (attempt === strategy.maxRetries) throw recoveryError;
          // Exponential backoff
          delay *= strategy.backoffFactor;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } finally {
      this.performanceMonitor.endTrace(traceId);
    }
  }

  private updateErrorMetrics(error: BettingSystemError): void {
    const metrics = this.errorMetrics.get(error.component) || {
      count: 0,
      lastOccurrence: 0,
      meanTimeBetweenErrors: 0,
      recoveryRate: 0,
      meanTimeToRecovery: 0
    };

    const timeSinceLastError = error.timestamp - metrics.lastOccurrence;
    metrics.count++;
    metrics.lastOccurrence = error.timestamp;
    metrics.meanTimeBetweenErrors = 
      (metrics.meanTimeBetweenErrors * (metrics.count - 1) + timeSinceLastError) / metrics.count;

    this.errorMetrics.set(error.component, metrics);

    // Emit metrics
    this.eventBus.emit('metric:recorded', {
      name: 'error_metrics',
      value: metrics.count,
      timestamp: Date.now(),
      labels: {
        component: error.component,
        code: error.code,
        severity: error.severity
      }
    });
  }

  private updateRecoveryMetrics(error: BettingSystemError, attempts: number): void {
    const metrics = this.errorMetrics.get(error.component);
    if (!metrics) return;

    metrics.recoveryRate = (metrics.recoveryRate * (metrics.count - 1) + 1) / metrics.count;
    metrics.meanTimeToRecovery = 
      (metrics.meanTimeToRecovery * (metrics.count - 1) + (Date.now() - error.timestamp)) / metrics.count;

    this.errorMetrics.set(error.component, metrics);
  }

  private shouldTriggerEmergency(error: BettingSystemError): boolean {
    const metrics = this.errorMetrics.get(error.component);
    if (!metrics) return false;

    const config = this.configManager.getConfig();
    return (
      error.severity === 'critical' ||
      metrics.count > config.system.errorHandling.maxRetries * 3 ||
      metrics.recoveryRate < 0.5
    );
  }

  private async triggerEmergencyProcedures(error: BettingSystemError): Promise<void> {
    const config = this.configManager.getConfig();
    config.system.emergencyMode = true;
    await this.configManager.updateConfig({ system: config.system });

    // Emit emergency alert
    this.eventBus.emit('monitor:alert', {
      id: `emergency_${Date.now()}`,
      severity: 'critical',
      message: `Emergency procedures triggered due to ${error.code} in ${error.component}`,
      timestamp: Date.now(),
      component: error.component,
      context: error.context,
      acknowledged: false
    });
  }

  private initializeRecoveryStrategies(): void {
    // Data component recovery
    this.recoveryStrategies.set('data', {
      maxRetries: this.DEFAULT_MAX_RETRIES,
      backoffFactor: this.DEFAULT_BACKOFF_FACTOR,
      timeout: this.DEFAULT_TIMEOUT,
      recoveryActions: [
        async (error: BettingSystemError) => {
          const config = this.configManager.getConfig();
          config.data.retryAttempts += 1;
          config.data.refreshInterval *= 1.5;
          await this.configManager.updateConfig({ data: config.data });
        }
      ]
    });

    // Prediction component recovery
    this.recoveryStrategies.set('prediction', {
      maxRetries: this.DEFAULT_MAX_RETRIES,
      backoffFactor: this.DEFAULT_BACKOFF_FACTOR,
      timeout: this.DEFAULT_TIMEOUT,
      recoveryActions: [
        async (error: BettingSystemError) => {
          const config = this.configManager.getConfig();
          config.prediction.minConfidence *= 1.2;
          config.prediction.ensembleSize = Math.max(2, config.prediction.ensembleSize - 1);
          await this.configManager.updateConfig({ prediction: config.prediction });
        }
      ]
    });

    // Strategy component recovery
    this.recoveryStrategies.set('strategy', {
      maxRetries: this.DEFAULT_MAX_RETRIES,
      backoffFactor: this.DEFAULT_BACKOFF_FACTOR,
      timeout: this.DEFAULT_TIMEOUT,
      recoveryActions: [
        async (error: BettingSystemError) => {
          const config = this.configManager.getConfig();
          config.strategy.riskTolerance *= 0.8;
          config.strategy.maxExposure *= 0.7;
          await this.configManager.updateConfig({ strategy: config.strategy });
        }
      ]
    });

    // Betting component recovery
    this.recoveryStrategies.set('betting', {
      maxRetries: this.DEFAULT_MAX_RETRIES,
      backoffFactor: this.DEFAULT_BACKOFF_FACTOR,
      timeout: this.DEFAULT_TIMEOUT,
      recoveryActions: [
        async (error: BettingSystemError) => {
          const config = this.configManager.getConfig();
          config.strategy.adaptiveStaking = true;
          config.strategy.hedgingEnabled = true;
          config.strategy.stopLoss *= 0.8;
          await this.configManager.updateConfig({ strategy: config.strategy });
        }
      ]
    });
  }

  private setupEventListeners(): void {
    this.eventBus.subscribe('config:updated', event => {
      const config = event.config;
      // Update recovery strategies based on new config
      for (const [component, strategy] of this.recoveryStrategies.entries()) {
        strategy.maxRetries = config.system.errorHandling.maxRetries;
        strategy.backoffFactor = config.system.errorHandling.backoffFactor;
        strategy.timeout = config.system.errorHandling.timeoutMs;
      }
    });
  }

  public getErrorMetrics(component?: string): ErrorMetrics | Map<string, ErrorMetrics> {
    if (component) {
      return this.errorMetrics.get(component) || {
        count: 0,
        lastOccurrence: 0,
        meanTimeBetweenErrors: 0,
        recoveryRate: 0,
        meanTimeToRecovery: 0
      };
    }
    return new Map(this.errorMetrics);
  }

  public getErrorHistory(component?: string): BettingSystemError[] {
    if (component) {
      return this.errorHistory.filter(error => error.component === component);
    }
    return [...this.errorHistory];
  }

  public clearErrorHistory(component?: string): void {
    if (component) {
      this.errorHistory.filter(error => error.component !== component);
      this.errorMetrics.delete(component);
    } else {
      this.errorHistory.length = 0;
      this.errorMetrics.clear();
    }
  }
} 