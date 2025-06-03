import { EventBus } from '../core/EventBus';
import { OddsUpdate, Alert } from '../types/core';
import { UnifiedConfigManager } from '../core/UnifiedConfig';
import { UnifiedErrorHandler } from '../core/UnifiedError';


export class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private readonly eventBus: EventBus;
  private readonly errorHandler: UnifiedErrorHandler;
  private readonly config: UnifiedConfigManager;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 1000;
  private subscriptions: Set<string> = new Set();
  private readonly WS_URL = process.env.WS_URL || 'ws://localhost:8080/ws';

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.errorHandler = UnifiedErrorHandler.getInstance();
    this.config = UnifiedConfigManager.getInstance();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.socket = new WebSocket(this.WS_URL);
      this.setupSocketHandlers();
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.subscriptions.clear();
  }

  public subscribe(channel: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.add(channel);
      this.sendMessage({
        type: 'subscribe',
        channel
      });
    }
  }

  public unsubscribe(channel: string): void {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.delete(channel);
      this.sendMessage({
        type: 'unsubscribe',
        channel
      });
    }
  }

  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.resubscribeAll();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        this.errorHandler.handleError(new Error(`Failed to parse WebSocket message: ${error}`));
      }
    };

    this.socket.onclose = () => {
      this.handleDisconnect();
    };

    this.socket.onerror = (event) => {
      this.handleConnectionError(new Error('WebSocket connection error'));
    };
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'odds_update':
        this.handleOddsUpdate(data.payload);
        break;
      case 'alert':
        this.handleAlert(data.payload);
        break;
      case 'error':
        this.handleError(data.payload);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  private handleOddsUpdate(payload: OddsUpdate): void {
    this.eventBus.emit('oddsUpdate', payload);
  }

  private handleAlert(payload: Alert): void {
    this.eventBus.emit('alert', payload);
  }

  private handleError(error: Error): void {
    this.errorHandler.handleError(error);
  }

  private handleConnectionError(error: Error): void {
    this.errorHandler.handleError(error);
    this.handleDisconnect();
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.RECONNECT_DELAY * this.reconnectAttempts);
    } else {
      this.errorHandler.handleError(
        new Error(`Failed to reconnect after ${this.MAX_RECONNECT_ATTEMPTS} attempts`)
      );
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach(channel => {
      this.sendMessage({
        type: 'subscribe',
        channel
      });
    });
  }

  private sendMessage(message: object): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }
} 