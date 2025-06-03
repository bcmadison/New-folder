import { Alert, AlertType } from '../hooks/useSmartAlerts';
import { BettingOpportunity } from './bettingStrategy';
import { EventEmitter } from 'eventemitter3';
import { WebSocketConfig } from '../types';


export interface WebSocketMessage {
  type: 'ALERT' | 'OPPORTUNITY' | 'LINE_UPDATE' | 'MARKET_UPDATE' | 'HEARTBEAT';
  data: any;
  timestamp: number;
}

export class WebSocketService extends EventEmitter {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private readonly config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting: boolean = false;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected: boolean = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private backoffInterval: number = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly wsUrl = import.meta.env.VITE_WS_URL || 'wss://api.prizepicks.com/ws';

  private constructor(config: WebSocketConfig) {
    super();
    this.config = {
      ...config
    };
    this.connect();
  }

  static getInstance(config: WebSocketConfig): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(config);
    }
    return WebSocketService.instance;
  }

  public connect(): void {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(error);
    }
  }

  public disconnect(): void {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectCount = 0;
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  public send(message: WebSocketMessage): void {
    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    const messageStr = JSON.stringify(message);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(messageStr);
    } else {
      this.messageQueue.push(message);
      this.connect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectCount = 0;
      this.isConnected = true;
      this.setupHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onclose = () => {
      this.handleDisconnect();
    };

    this.ws.onerror = (error: Event) => {
      this.handleError(error);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        this.handleError(error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    if (!message || !message.type) {
      console.warn('Invalid message format:', message);
      return;
    }

    if (!message.timestamp) {
      message.timestamp = Date.now();
    }

    try {
      switch (message.type) {
        case 'ALERT':
          this.processAlert(message.data as Alert);
          break;
        case 'OPPORTUNITY':
          this.processOpportunity(message.data as BettingOpportunity);
          break;
        case 'LINE_UPDATE':
          this.processLineUpdate(message.data);
          break;
        case 'MARKET_UPDATE':
          this.processMarketUpdate(message.data);
          break;
        case 'HEARTBEAT':
          this.processHeartbeat(message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to process message'));
    }
  }

  private processAlert(alert: Alert): void {
    if (!this.isValidAlert(alert)) {
      console.warn('Invalid alert data received:', alert);
      return;
    }

    switch (alert.type) {
      case 'INJURY':
        this.handleInjuryAlert(alert);
        break;
      case 'LINE_MOVEMENT':
        this.handleLineMovementAlert(alert);
        break;
      case 'WEATHER':
        this.handleWeatherAlert(alert);
        break;
      case 'ARBITRAGE':
        this.handleArbitrageAlert(alert);
        break;
    }
  }

  private isValidAlert(alert: Alert): boolean {
    return (
      alert &&
      typeof alert.id === 'string' &&
      typeof alert.type === 'string' &&
      typeof alert.severity === 'string' &&
      typeof alert.title === 'string' &&
      typeof alert.message === 'string' &&
      typeof alert.timestamp === 'number'
    );
  }

  private handleInjuryAlert(alert: Alert): void {
    if (alert.severity === 'high' && 'Notification' in window) {
      this.sendBrowserNotification(alert);
    }
  }

  private handleLineMovementAlert(alert: Alert): void {
    if (alert.metadata?.impactScore && alert.metadata.impactScore > 7) {
      this.sendBrowserNotification(alert);
    }
  }

  private handleWeatherAlert(alert: Alert): void {
    if (alert.severity === 'high') {
      this.sendBrowserNotification(alert);
    }
  }

  private handleArbitrageAlert(alert: Alert): void {
    this.sendBrowserNotification(alert);
  }

  private processOpportunity(opportunity: BettingOpportunity): void {
    if (opportunity.expectedValue > 5) {
      const alert: Alert = {
        id: `opp-${opportunity.id}`,
        type: 'ARBITRAGE',
        severity: 'high',
        title: 'High Value Opportunity',
        message: `${opportunity.market}: EV ${opportunity.expectedValue.toFixed(2)}%`,
        timestamp: Date.now(),
        metadata: {
          gameId: opportunity.id,
          impactScore: opportunity.expectedValue
        },
        read: false
      };
      this.sendBrowserNotification(alert);
    }
  }

  private processLineUpdate(data: any): void {
    // Process real-time line movement updates
    // Implementation depends on data structure
  }

  private processMarketUpdate(data: any): void {
    // Process market-wide updates
    // Implementation depends on data structure
  }

  private processHeartbeat(data: any): void {
    // Process heartbeat message
    // Implementation depends on data structure
  }

  private async sendBrowserNotification(alert: Alert): Promise<void> {
    if (!('Notification' in window)) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(alert.title, {
          body: alert.message,
          icon: '/favicon.ico'
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private setupHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'HEARTBEAT', data: { timestamp: Date.now() }, timestamp: Date.now() });
      }
    }, this.HEARTBEAT_INTERVAL); // 30 seconds heartbeat
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.cleanup();
    this.emit('disconnected');

    if (this.reconnectCount < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectCount++;
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectCount));
    } else {
      const error = new Error('Max reconnection attempts reached');
      this.emit('error', error);
    }
  }

  private handleError(error: unknown): void {
    this.isConnected = false;
    this.cleanup();
    this.emit('error', error);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getQueueLength(): number {
    return this.messageQueue.length;
  }
} 