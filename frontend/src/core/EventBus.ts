import { EventTypes, EventMap as CoreEventMap } from '../types/core';
import { AnalyticsReport } from '../services/AnalyticsService';

type EventCallback = (event: any) => void;

interface EventMap {
  'prediction:update': { data: { accuracy: number } };
  'data:updated': { sourceId: string; data: { timestamp: number } };
  'bet:placed': { data: { amount: number } };
  'bet:settled': { data: { amount: number; outcome: 'win' | 'loss' } };
  'analytics:report': AnalyticsReport;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventTypes, Set<EventCallback>> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends EventTypes>(event: K, callback: (event: CoreEventMap[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback as EventCallback);
  }

  public off<K extends EventTypes>(event: K, callback: (event: CoreEventMap[K]) => void): void {
    this.listeners.get(event)?.delete(callback as EventCallback);
  }

  public emit<K extends EventTypes>(event: K, data: CoreEventMap[K]): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = EventBus.getInstance();