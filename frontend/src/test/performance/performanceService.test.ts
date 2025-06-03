import { performanceService } from '../../services/performanceService';
import { performanceMonitor } from '../../utils/performanceMonitor';

describe('PerformanceService', () => {
  beforeEach(() => {
    performanceService.clearMetrics();
    performanceMonitor.clearMetrics();
  });

  describe('Metric Recording', () => {
    it('should record metrics correctly', () => {
      performanceService.recordMetric('test_metric', 100);
      const metrics = performanceService.getMetrics('test_metric');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(100);
    });

    it('should maintain maximum number of metrics', () => {
      for (let i = 0; i < 1100; i++) {
        performanceService.recordMetric('test_metric', i);
      }
      const metrics = performanceService.getMetrics('test_metric');
      expect(metrics).toHaveLength(1000);
      expect(metrics[0].value).toBe(100);
    });
  });

  describe('Performance Measurement', () => {
    it('should measure performance correctly', () => {
      performanceService.startMeasure('test_measure');
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 100) {}
      performanceService.endMeasure('test_measure');

      const metrics = performanceService.getMetrics('test_measure');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBeGreaterThanOrEqual(100);
    });

    it('should handle nested measurements', () => {
      performanceService.startMeasure('outer');
      performanceService.startMeasure('inner');
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 50) {}
      performanceService.endMeasure('inner');
      performanceService.endMeasure('outer');

      const innerMetrics = performanceService.getMetrics('inner');
      const outerMetrics = performanceService.getMetrics('outer');
      expect(innerMetrics[0].value).toBeLessThan(outerMetrics[0].value);
    });
  });

  describe('Report Generation', () => {
    it('should generate correct performance reports', () => {
      performanceService.recordMetric('test_metric', 100);
      performanceService.recordMetric('test_metric', 200);
      performanceService.recordMetric('test_metric', 300);

      const report = performanceService.generateReport();
      expect(report.metrics['test_metric']).toBeDefined();
      expect(report.metrics['test_metric'].count).toBe(3);
      expect(report.metrics['test_metric'].average).toBe(200);
      expect(report.metrics['test_metric'].min).toBe(100);
      expect(report.metrics['test_metric'].max).toBe(300);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track resource timing', () => {
      const resourceTiming = performanceMonitor.getResourceTiming();
      expect(Array.isArray(resourceTiming)).toBe(true);
    });

    it('should track navigation timing', () => {
      const navigationTiming = performanceMonitor.getNavigationTiming();
      expect(navigationTiming).toBeDefined();
    });

    it('should track paint timing', () => {
      const paintTiming = performanceMonitor.getPaintTiming();
      expect(Array.isArray(paintTiming)).toBe(true);
    });

    it('should track largest contentful paint', () => {
      const lcp = performanceMonitor.getLargestContentfulPaint();
      expect(lcp).toBeDefined();
    });

    it('should track first input delay', () => {
      const fid = performanceMonitor.getFirstInputDelay();
      expect(fid).toBeDefined();
    });

    it('should track cumulative layout shift', () => {
      const cls = performanceMonitor.getCumulativeLayoutShift();
      expect(cls).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing start mark gracefully', () => {
      expect(() => {
        performanceService.endMeasure('nonexistent_measure');
      }).not.toThrow();
    });

    it('should handle invalid metric names', () => {
      expect(() => {
        performanceService.recordMetric('', 100);
      }).not.toThrow();
    });
  });
}); 