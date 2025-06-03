import { performanceMonitor } from '../utils/performanceMonitor';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface PerformanceReport {
  timestamp: string;
  metrics: Record<string, {
    count: number;
    total: number;
    min: number;
    max: number;
    average: number;
  }>;
}

class PerformanceService {
  private static instance: PerformanceService;
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private readonly reportInterval = 60000; // 1 minute

  private constructor() {
    this.initializePerformanceObserver();
    this.startPeriodicReporting();
  }

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration);
        }
      });

      observer.observe({ entryTypes: ['measure', 'resource', 'paint', 'largest-contentful-paint'] });
    }
  }

  private startPeriodicReporting(): void {
    setInterval(() => {
      this.generateReport();
    }, this.reportInterval);
  }

  public startMeasure(name: string): void {
    performanceMonitor.startMeasure(name);
  }

  public endMeasure(name: string): void {
    performanceMonitor.endMeasure(name);
  }

  public recordMetric(name: string, value: number): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
    });

    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  public getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(metric => metric.name === name);
    }
    return [...this.metrics];
  }

  public getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  public generateReport(): PerformanceReport {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics.reduce((acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = {
            count: 0,
            total: 0,
            min: Infinity,
            max: -Infinity,
            average: 0,
          };
        }
        acc[metric.name].count++;
        acc[metric.name].total += metric.value;
        acc[metric.name].min = Math.min(acc[metric.name].min, metric.value);
        acc[metric.name].max = Math.max(acc[metric.name].max, metric.value);
        acc[metric.name].average = acc[metric.name].total / acc[metric.name].count;
        return acc;
      }, {} as Record<string, { count: number; total: number; min: number; max: number; average: number }>),
    };

    // Send report to monitoring service
    this.sendReportToMonitoring(report);

    return report;
  }

  private async sendReportToMonitoring(report: PerformanceReport): Promise<void> {
    try {
      // In production, send to actual monitoring service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/monitoring/performance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        });
      } else {
        console.log('Performance Report:', report);
      }
    } catch (error) {
      console.error('Error sending performance report:', error);
    }
  }

  public clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceService = PerformanceService.getInstance(); 