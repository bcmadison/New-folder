import * as Sentry from '@sentry/react';
import { Span, Transaction } from '@sentry/types';


// This service can be used to send custom performance metrics or user interaction traces.
// Sentry is already initialized in main.tsx for basic performance monitoring (tracesSampleRate).

/**
 * PerformanceTrackingService
 *
 * Provides utility functions to instrument custom performance monitoring
 * using Sentry. This allows for detailed tracing of application-specific
 * operations and collection of custom metrics.
 */

class PerformanceTrackingService {
  private activeTransactions: Map<string, Transaction> = new Map();

  constructor() {
    
    // You can configure Sentry further here if needed, though main init is in main.tsx
  }

  /**
   * Starts a new Sentry transaction for a specific operation.
   * Transactions group multiple spans (operations) together.
   *
   * @param name A descriptive name for the transaction (e.g., 'user_login_flow', 'load_dashboard_data').
   * @param op An operation name, often a category (e.g., 'ui.load', 'api.request', 'function').
   * @param description Optional longer description for the transaction.
   * @returns The Sentry Transaction object, or undefined if Sentry is not fully configured.
   */
  public startTrace(name: string, op: string, description?: string): Transaction | undefined {
    if (!Sentry.getCurrentHub().getClient()) {
      console.warn('[PerformanceTrackingService] Sentry client not available. Cannot start trace.');
      return undefined;
    }

    const transaction = Sentry.startTransaction({
      name,
      op,
      description,
      // You can add more context/tags here if needed globally for this trace
    });

    Sentry.getCurrentHub().configureScope((scope: Sentry.Scope) => scope.setSpan(transaction));
    this.activeTransactions.set(name, transaction); // Store if you need to retrieve it by name later
    
    return transaction;
  }

  /**
   * Adds a child span to an active Sentry transaction.
   * Spans measure individual operations within a transaction.
   *
   * @param parentTransaction The Sentry Transaction to add this span to.
   * @param op An operation name for the span (e.g., 'db.query', 'file.read', 'ui.render').
   * @param description Optional description for the span.
   * @param data Optional data to attach to the span.
   * @returns The Sentry Span object, or undefined if the parent transaction is invalid.
   */
  public addSpanToTrace(parentTransaction: Transaction | undefined, op: string, description?: string, data?: Record<string, any>): Span | undefined {
    if (!parentTransaction) {
      console.warn('[PerformanceTrackingService] No parent transaction provided. Cannot add span.');
      return undefined;
    }
    const span = parentTransaction.startChild({
      op,
      description,
      data,
    });
    // 
    return span;
  }

  /**
   * Finishes an active Sentry transaction.
   * @param transaction The Sentry Transaction object to finish.
   */
  public endTrace(transaction: Transaction | undefined): void {
    if (transaction) {
      transaction.finish();
      this.activeTransactions.delete(transaction.name); // Remove from active map
      // 
    } else {
      console.warn('[PerformanceTrackingService] Attempted to end an undefined trace.');
    }
  }

  /**
   * Finishes a Sentry span.
   * @param span The Sentry Span object to finish.
   */
  public endSpan(span: Span | undefined): void {
    if (span) {
      span.finish();
      // 
    }
  }

  /**
   * Records a custom metric.
   * Sentry supports different metric types: counter, gauge, distribution, set.
   * Refer to Sentry documentation for details on `Sentry.metrics.increment` and other metric types.
   *
   * @param name The name of the metric (e.g., 'props_loaded_count', 'api_response_time_ms').
   * @param value The value of the metric.
   * @param unit Optional unit for the metric (e.g., 'millisecond', 'byte'). Sentry has predefined units.
   * @param tags Optional key-value pairs to associate with the metric for segmentation.
   * @param type The type of metric. Default is 'increment' (counter). Other common types: 'distribution', 'gauge', 'set'.
   */
  public recordMetric({
    name,
    value,
    unit,
    tags,
    type = 'increment' // default to counter
  }: {
    name: string;
    value: number;
    unit?: string;
    tags?: Record<string, string | number | boolean>;
    type?: 'increment' | 'distribution' | 'gauge' | 'set';
  }): void {
    if (!Sentry.getCurrentHub().getClient()) {
      console.warn('[PerformanceTrackingService] Sentry client not available. Cannot record metric.');
      return;
    }
    
    switch (type) {
      case 'distribution':
        Sentry.metrics.distribution(name, value, { unit, tags });
        break;
      case 'gauge':
        Sentry.metrics.gauge(name, value, { unit, tags });
        break;
      case 'set':
        // For 'set', value is typically a string or number to be added to the set.
        // Sentry's Node SDK has `Sentry.metrics.set(name, value, { unit, tags });`
        // React SDK might require specific handling or might not fully support 'set' in the same way.
        // For simplicity, we'll treat it like increment for now, or you might need a different value type.
        // Check Sentry React SDK docs for the most up-to-date API for 'set' metrics.
        Sentry.metrics.increment(name, value, { unit, tags }); // Fallback or adjust as per Sentry React SDK
        console.warn('[PerformanceTrackingService] \'set\' metric type might have specific usage in React SDK. Review Sentry docs.');
        break;
      case 'increment':
      default:
        Sentry.metrics.increment(name, value, { unit, tags });
        break;
    }
  }

  /**
   * Sets a custom tag on the current Sentry scope.
   * Tags are key-value pairs that help categorize events.
   *
   * @param key The tag key.
   * @param value The tag value.
   */
  public setTag(key: string, value: string | number | boolean): void {
    Sentry.setTag(key, value);
    // 
  }

  /**
   * Sets extra context data on the current Sentry scope.
   * Extra data is arbitrary information attached to events.
   *
   * @param key The context key.
   * @param data The context data.
   */
  public setExtra(key: string, data: any): void {
    Sentry.setExtra(key, data);
    // 
  }
}

// Export a singleton instance of the service
export const performanceTrackingService = new PerformanceTrackingService();

/**
 * Example Usage (conceptual):
 *
 * async function loadDashboard() {
 *   const trace = performanceTrackingService.startTrace('load_dashboard_page', 'ui.page_load');
 *   let fetchDataSpan: Span | undefined;
 *   try {
 *     fetchDataSpan = performanceTrackingService.addSpanToTrace(trace, 'api.fetch_data', 'Fetching all dashboard data');
 *     // ... await Promise.all([...]) ...
 *     performanceTrackingService.recordMetric({ name: 'dashboard.data.items_loaded', value: 100 });
 *   } catch (e) {
 *     Sentry.captureException(e); // Capture error if something goes wrong
 *   } finally {
 *     if(fetchDataSpan) performanceTrackingService.endSpan(fetchDataSpan);
 *     if(trace) performanceTrackingService.endTrace(trace);
 *   }
 * }
 */ 