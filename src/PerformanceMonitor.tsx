import React, { useEffect } from 'react';
import { PerformanceMonitor as CorePerformanceMonitor } from '../core/PerformanceMonitor';
import { UnifiedMonitor } from '../core/UnifiedMonitor';



interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
}

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    const monitor = UnifiedMonitor.getInstance();
    const performanceMonitor = CorePerformanceMonitor.getInstance();

    // Initialize metrics
    const metrics: PerformanceMetrics = {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null
    };

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        metrics.fcp = entries[0].startTime;
        // monitor.recordMetric('performance', { fcp: metrics.fcp });
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        metrics.lcp = entries[entries.length - 1].startTime;
        // monitor.recordMetric('performance', { lcp: metrics.lcp });
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        metrics.fid = entries[0].duration;
        // monitor.recordMetric('performance', { fid: metrics.fid });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as LayoutShiftEntry;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
      metrics.cls = clsValue;
      // monitor.recordMetric('performance', { cls: metrics.cls });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte
    const navigationEntries = performance.getEntriesByType('navigation');
    if (navigationEntries.length > 0) {
      metrics.ttfb = (navigationEntries[0] as PerformanceNavigationTiming).responseStart;
      // monitor.recordMetric('performance', { ttfb: metrics.ttfb });
    }

    // Report metrics periodically
    const reportInterval = setInterval(() => {
      // monitor.recordMetric('web_vitals', metrics);
    }, 30000);

    return () => {
      // Cleanup observers
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      clearInterval(reportInterval);
    };
  }, []);

  return null;
}; 