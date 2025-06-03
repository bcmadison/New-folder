interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

interface PerformanceMark {
  name: string;
  startTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private marks: Map<string, PerformanceMark> = new Map();
  private measures: Map<string, number[]> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializePerformanceObserver();
    }
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry.name, entry.duration);
        }
      });

      observer.observe({ entryTypes: ['measure', 'resource'] });
    }
  }

  public startMeasure(name: string): void {
    if (typeof performance === 'undefined') return;

    const markName = `${name}_start`;
    performance.mark(markName);
    this.marks.set(name, {
      name: markName,
      startTime: performance.now(),
    });
  }

  public endMeasure(name: string): void {
    if (typeof performance === 'undefined') return;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`No start mark found for measure: ${name}`);
      return;
    }

    const endMarkName = `${name}_end`;
    performance.mark(endMarkName);

    try {
      performance.measure(name, mark.name, endMarkName);
      const entries = performance.getEntriesByName(name);
      const duration = entries[entries.length - 1].duration;

      if (!this.measures.has(name)) {
        this.measures.set(name, []);
      }
      this.measures.get(name)?.push(duration);

      // Clean up marks and measures
      performance.clearMarks(mark.name);
      performance.clearMarks(endMarkName);
      performance.clearMeasures(name);
    } catch (error) {
      console.error(`Error measuring performance for ${name}:`, error);
    }

    this.marks.delete(name);
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

  public clearMetrics(): void {
    this.metrics = [];
  }

  public logPerformanceReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics.reduce((acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = {
            count: 0,
            total: 0,
            min: Infinity,
            max: -Infinity,
          };
        }
        acc[metric.name].count++;
        acc[metric.name].total += metric.value;
        acc[metric.name].min = Math.min(acc[metric.name].min, metric.value);
        acc[metric.name].max = Math.max(acc[metric.name].max, metric.value);
        return acc;
      }, {} as Record<string, { count: number; total: number; min: number; max: number }>),
    };

    console.log('Performance Report:', report);
    return report;
  }

  public getMeasurements(name: string): number[] {
    return this.measures.get(name) || [];
  }

  public getAverageMeasurement(name: string): number {
    const measurements = this.getMeasurements(name);
    if (measurements.length === 0) return 0;

    const sum = measurements.reduce((acc, val) => acc + val, 0);
    return sum / measurements.length;
  }

  public clearMeasurements(name?: string): void {
    if (name) {
      this.measures.delete(name);
    } else {
      this.measures.clear();
    }
  }

  public getResourceTiming(): PerformanceResourceTiming[] {
    if (typeof performance === 'undefined') return [];

    return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  }

  public getNavigationTiming(): PerformanceNavigationTiming | null {
    if (typeof performance === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation || null;
  }

  public getPaintTiming(): PerformancePaintTiming[] {
    if (typeof performance === 'undefined') return [];

    return performance.getEntriesByType('paint') as PerformancePaintTiming[];
  }

  public getLargestContentfulPaint(): PerformanceEntry | null {
    if (typeof performance === 'undefined') return null;

    const entries = performance.getEntriesByType('largest-contentful-paint');
    return entries[entries.length - 1] || null;
  }

  public getFirstInputDelay(): PerformanceEventTiming | null {
    if (typeof performance === 'undefined') return null;

    const entries = performance.getEntriesByType('first-input');
    return entries[0] as PerformanceEventTiming || null;
  }

  public getCumulativeLayoutShift(): PerformanceEntry | null {
    if (typeof performance === 'undefined') return null;

    const entries = performance.getEntriesByType('layout-shift');
    return entries[entries.length - 1] || null;
  }
}

export const performanceMonitor = new PerformanceMonitor(); 