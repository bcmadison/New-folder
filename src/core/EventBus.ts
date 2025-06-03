import EventEmitter from 'eventemitter3';

// Minimal EventTypes for EventBus
export interface EventTypes {
  [event: string]: any;
}

export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public on<K extends keyof EventTypes & (string | symbol)>(event: K, listener: (data: EventTypes[K]) => void): void {
    this.emitter.on(event as string | symbol, listener);
  }

  public once<K extends keyof EventTypes & (string | symbol)>(event: K, listener: (data: EventTypes[K]) => void): void {
    this.emitter.once(event as string | symbol, listener);
  }

  public off<K extends keyof EventTypes & (string | symbol)>(event: K, listener: (data: EventTypes[K]) => void): void {
    this.emitter.off(event as string | symbol, listener);
  }

  public emit<K extends keyof EventTypes & (string | symbol)>(event: K, data: EventTypes[K]): void {
    this.emitter.emit(event as string | symbol, data);
  }

  public removeAllListeners<K extends keyof EventTypes & (string | symbol)>(event?: K): void {
    this.emitter.removeAllListeners(event as string | symbol | undefined);
  }

  public listenerCount<K extends keyof EventTypes & (string | symbol)>(event: K): number {
    return this.emitter.listenerCount(event as string | symbol);
  }

  public listeners<K extends keyof EventTypes & (string | symbol)>(event: K): Array<(data: EventTypes[K]) => void> {
    return this.emitter.listeners(event as string | symbol) as Array<(data: EventTypes[K]) => void>;
  }

  public eventNames(): Array<keyof EventTypes> {
    return this.emitter.eventNames() as Array<keyof EventTypes>;
  }
} 