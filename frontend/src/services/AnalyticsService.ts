import { EventBus } from '../core/EventBus';
import { UnifiedConfigManager } from '../core/UnifiedConfig';
import { performanceService } from './performanceService';
import { performanceMonitor } from '../utils/performanceMonitor';
import { EventTypes, EventMap, BettingOpportunity, TimestampedData } from '../types/core';

interface AnalyticsMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'performance' | 'betting' | 'risk' | 'arbitrage';
}

export interface AnalyticsReport {
  timestamp: number;
  metrics: Record<string, AnalyticsMetric[]>;
  summary: {
    totalBets: number;
    winRate: number;
    averageOdds: number;
    riskScore: number;
    performanceScore: number;
  };
}

interface PerformanceMetrics {
  [key: string]: number;
}

export class AnalyticsService {
  private static instance: AnalyticsService;
  private config: any;
  private analyticsMetrics: Map<string, AnalyticsMetric[]> = new Map();
  private readonly MAX_METRICS = 1000;
  private metrics: PerformanceMetrics = {};

  private constructor() {
    this.config = UnifiedConfigManager.getInstance().getConfig();
    this.setupEventListeners();
    this.startPeriodicUpdates();
    this.initializePerformanceMonitoring();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private initializePerformanceMonitoring() {
    // Track performance metrics
    performanceMonitor.getResourceTiming().forEach(timing => {
      this.recordAnalyticsMetric({
        name: 'resource_timing',
        value: timing.duration,
        timestamp: timing.startTime,
        category: 'performance'
      });
    });

    // Track navigation timing
    const navTiming = performanceMonitor.getNavigationTiming();
    if (navTiming) {
      this.recordAnalyticsMetric({
        name: 'navigation_timing',
        value: navTiming.loadEventEnd - navTiming.startTime,
        timestamp: navTiming.startTime,
        category: 'performance'
      });
    }

    // Track paint timing
    performanceMonitor.getPaintTiming().forEach(timing => {
      this.recordAnalyticsMetric({
        name: 'paint_timing',
        value: timing.startTime,
        timestamp: timing.startTime,
        category: 'performance'
      });
    });
  }

  public recordAnalyticsMetric(metric: AnalyticsMetric) {
    const metrics = this.analyticsMetrics.get(metric.name) || [];
    metrics.push(metric);
    
    if (metrics.length > this.MAX_METRICS) {
      metrics.shift();
    }
    
    this.analyticsMetrics.set(metric.name, metrics);
    performanceService.recordMetric(metric.name, metric.value);
  }

  public getAnalyticsMetrics(name: string): AnalyticsMetric[] {
    return this.analyticsMetrics.get(name) || [];
  }

  public generateAnalyticsReport(): AnalyticsReport {
    const timestamp = Date.now();
    const metrics = Object.fromEntries(this.analyticsMetrics);
    
    // Calculate summary statistics
    const bettingMetrics = this.getMetricsByCategory('betting');
    const totalBets = bettingMetrics.length;
    const winRate = this.calculateWinRate(bettingMetrics);
    const averageOdds = this.calculateAverageOdds(bettingMetrics);
    const riskScore = this.calculateRiskScore();
    const performanceScore = this.calculatePerformanceScore();

    return {
      timestamp,
      metrics,
      summary: {
        totalBets,
        winRate,
        averageOdds,
        riskScore,
        performanceScore
      }
    };
  }

  private getMetricsByCategory(category: AnalyticsMetric['category']): AnalyticsMetric[] {
    return Array.from(this.analyticsMetrics.values())
      .flat()
      .filter(metric => metric.category === category);
  }

  private calculateWinRate(metrics: AnalyticsMetric[]): number {
    if (metrics.length === 0) return 0;
    const wins = metrics.filter(m => m.value > 0).length;
    return (wins / metrics.length) * 100;
  }

  private calculateAverageOdds(metrics: AnalyticsMetric[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  private calculateRiskScore(): number {
    const riskMetrics = this.getMetricsByCategory('risk');
    if (riskMetrics.length === 0) return 0;
    
    const recentMetrics = riskMetrics.slice(-10);
    const averageRisk = recentMetrics.reduce((acc, m) => acc + m.value, 0) / recentMetrics.length;
    return Math.min(100, Math.max(0, averageRisk));
  }

  private calculatePerformanceScore(): number {
    const performanceMetrics = this.getMetricsByCategory('performance');
    if (performanceMetrics.length === 0) return 0;

    const recentMetrics = performanceMetrics.slice(-10);
    const averagePerformance = recentMetrics.reduce((acc, m) => acc + m.value, 0) / recentMetrics.length;
    return Math.min(100, Math.max(0, averagePerformance));
  }

  public clearAnalyticsMetrics() {
    this.analyticsMetrics.clear();
  }

  private setupEventListeners() {
    EventBus.getInstance().on('prediction:update', (event: BettingOpportunity) => {
      this.recordAnalyticsMetric({
        name: 'prediction_accuracy',
        value: event.confidence,
        timestamp: event.timestamp,
        category: 'betting'
      });
    });

    EventBus.getInstance().on('data:updated', (event: { data: TimestampedData[] | Record<string, any>; sourceId?: string; timestamp: number }) => {
      if (event.sourceId) {
        this.recordAnalyticsMetric({
          name: `data_update_${event.sourceId}`,
          value: event.timestamp,
          timestamp: Date.now(),
          category: 'performance'
        });
      }
    });

    EventBus.getInstance().on('bettingDecision', (event) => {
      this.recordAnalyticsMetric({
        name: 'bet_placed',
        value: event.stake,
        timestamp: Date.now(),
        category: 'betting'
      });
    });
  }

  private startPeriodicUpdates() {
    setInterval(() => {
      const report = this.generateAnalyticsReport();
      EventBus.getInstance().emit('analytics:report' as keyof EventMap, report);
    }, 60000); // Update every minute
  }

  public getConfig() {
    return { ...this.config };
  }
}

export const analyticsService = AnalyticsService.getInstance(); 