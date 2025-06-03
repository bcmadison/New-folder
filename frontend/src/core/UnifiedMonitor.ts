import { SystemError, ErrorContext, ErrorCode } from '@/core/UnifiedError';

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface TraceData {
  name: string;
  type: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  tags?: Record<string, string>;
}

export interface MonitorConfig {
  enabled: boolean;
  sampleRate: number;
  maxBatchSize: number;
  flushInterval: number;
  endpoint: string;
}

export class UnifiedMonitor {
  private static instance: UnifiedMonitor;
  private config: MonitorConfig;
  private metrics: MetricData[] = [];
  private traces: TraceData[] = [];
  private errors: ErrorContext[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      enabled: true,
      sampleRate: 1.0,
      maxBatchSize: 100,
      flushInterval: 60000, // 1 minute
      endpoint: '/api/monitoring'
    };
  }

  public static getInstance(): UnifiedMonitor {
    if (!UnifiedMonitor.instance) {
      UnifiedMonitor.instance = new UnifiedMonitor();
    }
    return UnifiedMonitor.instance;
  }

  public configure(config: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...config };
    this.setupFlushTimer();
  }

  private setupFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.config.enabled) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  public startTrace(name: string, type: string, tags?: Record<string, string>): TraceData {
    if (!this.config.enabled) {
      return { name, type, startTime: Date.now() };
    }

    const trace: TraceData = {
      name,
      type,
      startTime: Date.now(),
      tags
    };

    this.traces.push(trace);
    return trace;
  }

  public endTrace(trace: TraceData, status?: number): void {
    if (!this.config.enabled) return;

    const endTime = Date.now();
    trace.endTime = endTime;
    trace.duration = endTime - trace.startTime;
    trace.status = status;

    if (this.traces.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  public recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) return;

    const metric: MetricData = {
      name,
      value,
      tags,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    if (this.metrics.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  public reportError(error: Error, context?: Partial<ErrorContext>): void {
    if (!this.config.enabled) return;

    const errorContext: ErrorContext = {
      code: error instanceof SystemError ? error.code : 'UNKNOWN_ERROR' as ErrorCode,
      message: error.message,
      details: error instanceof SystemError ? (error as SystemError).details : {},
      originalError: error,
      timestamp: Date.now(),
      ...context
    };

    this.errors.push(errorContext);

    if (this.errors.length >= this.config.maxBatchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (!this.config.enabled || (!this.metrics.length && !this.traces.length && !this.errors.length)) {
      return;
    }

    const batch = {
      metrics: this.metrics,
      traces: this.traces,
      errors: this.errors
    };

    // Clear the buffers
    this.metrics = [];
    this.traces = [];
    this.errors = [];

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(batch)
      });
    } catch (error) {
      console.error('[UnifiedMonitor] Failed to flush monitoring data:', error);
      // Restore the data that failed to send
      this.metrics = [...this.metrics, ...batch.metrics];
      this.traces = [...this.traces, ...batch.traces];
      this.errors = [...this.errors, ...batch.errors];
    }
  }

  public async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

// Export singleton instance
export const unifiedMonitor = UnifiedMonitor.getInstance(); 