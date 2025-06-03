// src/core/UnifiedState.ts

/**
 * UnifiedState
 *
 * Manages critical, low-level, cross-cutting global application state that may not fit
 * directly into Zustand stores, or is more tightly coupled with the operational state
 * of the core engines. 
 *
 * ⚠️ Use with caution. Most UI-related and data-cache state should reside in Zustand stores (`useAppStore`).
 * This store is intended for specific, non-reactive or engine-internal states if absolutely necessary.
 *
 * Examples of potential use (if not handled elsewhere):
 * - System-wide flags (e.g., 'MAINTENANCE_MODE', 'INITIAL_LOAD_COMPLETE')
 * - Core engine operational status (e.g., 'PredictionEngine_STATUS: ready | degraded')
 * - Singleton service readiness flags
 */

import { SystemError } from '@/core/UnifiedError';
import { unifiedMonitor } from '@/core/UnifiedMonitor';

export type StateKey = string;
export type StateValue = any;

export interface StateChange<T = StateValue> {
  key: StateKey;
  oldValue: T | undefined;
  newValue: T;
  timestamp: number;
}

export interface StateConfig {
  persistence: boolean;
  storageKey: string;
  maxHistorySize: number;
  debounceTime: number;
}

export type StateListener<T = StateValue> = (change: StateChange<T>) => void;

export class UnifiedStateManager {
  private static instance: UnifiedStateManager;
  private state: Map<StateKey, StateValue> = new Map();
  private listeners: Map<StateKey, Set<StateListener>> = new Map();
  private history: StateChange[] = [];
  private config: StateConfig;
  private initialized: boolean = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.config = {
      persistence: true,
      storageKey: 'app_state',
      maxHistorySize: 100,
      debounceTime: 1000
    };
  }

  public static getInstance(): UnifiedStateManager {
    if (!UnifiedStateManager.instance) {
      UnifiedStateManager.instance = new UnifiedStateManager();
    }
    return UnifiedStateManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (this.config.persistence) {
        await this.loadFromStorage();
      }
      this.initialized = true;
      unifiedMonitor.recordMetric('state_initialized', 1);
    } catch (error) {
      throw new SystemError('STATE_INITIALIZATION_FAILED', 'Failed to initialize state manager', error as Error);
    }
  }

  public configure(config: Partial<StateConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public get<T = StateValue>(key: StateKey): T | undefined {
    if (!this.initialized) {
      throw new SystemError('STATE_NOT_INITIALIZED', 'State manager must be initialized before use');
    }
    return this.state.get(key) as T | undefined;
  }

  public set<T = StateValue>(key: StateKey, value: T): void {
    if (!this.initialized) {
      throw new SystemError('STATE_NOT_INITIALIZED', 'State manager must be initialized before use');
    }

    const oldValue = this.state.get(key);
    const change: StateChange<T> = {
      key,
      oldValue,
      newValue: value,
      timestamp: Date.now()
    };

    this.state.set(key, value);
    this.addToHistory(change);
    this.notifyListeners(change);

    if (this.config.persistence) {
      this.scheduleSave();
    }
  }

  public subscribe<T = StateValue>(key: StateKey, listener: StateListener<T>): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener as StateListener);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener as StateListener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  public getHistory(): StateChange[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
  }

  private addToHistory(change: StateChange): void {
    this.history.push(change);
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift();
    }
  }

  private notifyListeners<T>(change: StateChange<T>): void {
    const keyListeners = this.listeners.get(change.key);
    if (keyListeners) {
      keyListeners.forEach(listener => {
        try {
          listener(change);
        } catch (error) {
          unifiedMonitor.reportError(error as Error, {
            component: 'UnifiedState',
            action: 'notifyListeners'
          });
        }
      });
    }
  }

  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToStorage();
    }, this.config.debounceTime);
  }

  private async saveToStorage(): Promise<void> {
    try {
      const stateObject = Object.fromEntries(this.state);
      localStorage.setItem(this.config.storageKey, JSON.stringify(stateObject));
      unifiedMonitor.recordMetric('state_saved', 1);
    } catch (error) {
      unifiedMonitor.reportError(error as Error, {
        component: 'UnifiedState',
        action: 'saveToStorage'
      });
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const savedState = localStorage.getItem(this.config.storageKey);
      if (savedState) {
        const stateObject = JSON.parse(savedState);
        Object.entries(stateObject).forEach(([key, value]) => {
          this.state.set(key, value);
        });
        unifiedMonitor.recordMetric('state_loaded', 1);
      }
    } catch (error) {
      unifiedMonitor.reportError(error as Error, {
        component: 'UnifiedState',
        action: 'loadFromStorage'
      });
    }
  }

  public async shutdown(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    if (this.config.persistence) {
      await this.saveToStorage();
    }
  }
}

// Export singleton instance
export const unifiedState = UnifiedStateManager.getInstance();

// // Example Usage:
// unifiedState.set('SYSTEM_MAINTENANCE_MODE', true);
// const isInMaintenance = unifiedState.get<boolean>('SYSTEM_MAINTENANCE_MODE', false);
// if (isInMaintenance) {
//   console.warn('Application is currently in maintenance mode.');
// }
