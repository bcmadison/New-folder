import { EventBus } from './EventBus';


interface Trace {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata: Record<string, any>;
  events: TraceEvent[];
  error?: Error;
}

interface TraceEvent {
  name: string;
  timestamp: number;
  metadata: Record<string, any>;
}

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
}

interface ErrorReport {
  id: string;
  error: Error;
  context: Record<string, any>;
  timestamp: number;
  trace?: Trace;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private eventBus: EventBus;
  private traces: Map<string, Trace>;
  private metrics: Metric[];
  private errors: ErrorReport[];
  private readonly RETENTION_PERIOD = 86400000; // 24 hours in milliseconds

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.traces = new Map();
    this.metrics = [];
    this.errors = [];

    this.initializeCleanupInterval();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeCleanupInterval(): void {
    setInterval(() => {
      this.cleanupOldData();
    }, this.RETENTION_PERIOD / 24); // Run cleanup every hour
  }

  public startTrace(name: string, metadata: Record<string, any> = {}): Trace {
    const trace: Trace = {
      id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      startTime: Date.now(),
      metadata,
      events: []
    };

    this.traces.set(trace.id, trace);
    return trace;
  }

  public endTrace(trace: Trace, error?: Error): void {
    if (!trace || !this.traces.has(trace.id)) {
      return;
    }

    const endTime = Date.now();
    const duration = endTime - trace.startTime;

    const updatedTrace: Trace = {
      ...trace,
      endTime,
      duration,
      error
    };

    this.traces.set(trace.id, updatedTrace);

    // Emit trace completion event
    this.eventBus.emit('error', new Error(`Trace completed: ${trace.name} (${duration}ms)`));

    // Record trace duration metric
    this.recordMetric('trace_duration', duration, {
      name: trace.name,
      status: error ? 'error' : 'success'
    });
  }

  public addTraceEvent(trace: Trace, name: string, metadata: Record<string, any> = {}): void {
    if (!trace || !this.traces.has(trace.id)) {
      return;
    }

    const event: TraceEvent = {
      name,
      timestamp: Date.now(),
      metadata
    };

    const updatedTrace = this.traces.get(trace.id)!;
    updatedTrace.events.push(event);
    this.traces.set(trace.id, updatedTrace);
  }

  public recordMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);
  }

  public recordError(
    error: Error,
    context: Record<string, any> = {},
    trace?: Trace
  ): void {
    const errorReport: ErrorReport = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      error,
      context,
      timestamp: Date.now(),
      trace
    };

    this.errors.push(errorReport);
    this.eventBus.emit('error', error);

    // Record error metric
    this.recordMetric('error_count', 1, {
      type: error.name,
      message: error.message
    });
  }

  public getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  public getMetrics(
    name?: string,
    startTime?: number,
    endTime?: number
  ): Metric[] {
    let filteredMetrics = this.metrics;

    if (name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === name);
    }

    if (startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
    }

    return filteredMetrics;
  }

  public getErrors(
    startTime?: number,
    endTime?: number,
    errorType?: string
  ): ErrorReport[] {
    let filteredErrors = this.errors;

    if (startTime) {
      filteredErrors = filteredErrors.filter(e => e.timestamp >= startTime);
    }

    if (endTime) {
      filteredErrors = filteredErrors.filter(e => e.timestamp <= endTime);
    }

    if (errorType) {
      filteredErrors = filteredErrors.filter(e => e.error.name === errorType);
    }

    return filteredErrors;
  }

  public getActiveTraces(): Trace[] {
    return Array.from(this.traces.values())
      .filter(trace => !trace.endTime);
  }

  public getCompletedTraces(
    startTime?: number,
    endTime?: number,
    name?: string
  ): Trace[] {
    let filteredTraces = Array.from(this.traces.values())
      .filter(trace => trace.endTime);

    if (startTime) {
      filteredTraces = filteredTraces.filter(t => t.startTime >= startTime);
    }

    if (endTime) {
      filteredTraces = filteredTraces.filter(t => t.endTime! <= endTime);
    }

    if (name) {
      filteredTraces = filteredTraces.filter(t => t.name === name);
    }

    return filteredTraces;
  }

  public calculateMetricStatistics(
    name: string,
    startTime?: number,
    endTime?: number
  ): {
    min: number;
    max: number;
    avg: number;
    count: number;
    p95: number;
    p99: number;
  } {
    const metrics = this.getMetrics(name, startTime, endTime);
    const values = metrics.map(m => m.value);

    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        count: 0,
        p95: 0,
        p99: 0
      };
    }

    values.sort((a, b) => a - b);
    const p95Index = Math.floor(values.length * 0.95);
    const p99Index = Math.floor(values.length * 0.99);

    return {
      min: values[0],
      max: values[values.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
      p95: values[p95Index],
      p99: values[p99Index]
    };
  }

  public calculateErrorRate(
    startTime?: number,
    endTime?: number
  ): {
    total: number;
    rate: number;
    byType: Record<string, number>;
  } {
    const errors = this.getErrors(startTime, endTime);
    const totalTime = (endTime || Date.now()) - (startTime || Date.now() - 3600000);
    const errorsByType: Record<string, number> = {};

    errors.forEach(error => {
      const type = error.error.name;
      errorsByType[type] = (errorsByType[type] || 0) + 1;
    });

    return {
      total: errors.length,
      rate: errors.length / (totalTime / 1000), // errors per second
      byType: errorsByType
    };
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.RETENTION_PERIOD;

    // Clean up old traces
    for (const [id, trace] of this.traces) {
      if (trace.endTime && trace.endTime < cutoffTime) {
        this.traces.delete(id);
      }
    }

    // Clean up old metrics
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    // Clean up old errors
    this.errors = this.errors.filter(e => e.timestamp >= cutoffTime);
  }
} 