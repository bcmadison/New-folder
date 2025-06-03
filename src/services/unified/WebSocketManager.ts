import EventEmitter from 'eventemitter3';
import { WSMessage } from '../../types';

interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

interface WebSocketConnection {
  socket: WebSocket;
  messageQueue: WSMessage[];
  isConnected: boolean;
  reconnectAttempts: number;
  heartbeatTimer?: NodeJS.Timeout;
}

export class WebSocketManager extends EventEmitter {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocketConnection>;
  private readonly defaultConfig: Required<WebSocketConfig>;

  private constructor() {
    super();
    this.connections = new Map();
    this.defaultConfig = {
      url: 'wss://api.betproai.com/ws',
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      heartbeatInterval: 30000
    };
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public connect(config: WebSocketConfig): void {
    const fullConfig = { ...this.defaultConfig, ...config };
    
    if (this.connections.has(fullConfig.url)) {
      return;
    }

    const connection: WebSocketConnection = {
      socket: new WebSocket(fullConfig.url),
      messageQueue: [],
      isConnected: false,
      reconnectAttempts: 0
    };

    this.setupSocketHandlers(connection, fullConfig);
    this.connections.set(fullConfig.url, connection);
  }

  private setupSocketHandlers(connection: WebSocketConnection, config: Required<WebSocketConfig>): void {
    const { socket } = connection;

    socket.onopen = () => {
      connection.isConnected = true;
      connection.reconnectAttempts = 0;
      this.processMessageQueue(connection);
      this.setupHeartbeat(connection, config);
      this.emit('connected', config.url);
    };

    socket.onclose = () => {
      connection.isConnected = false;
      this.clearHeartbeat(connection);
      this.emit('disconnected', config.url);
      this.handleReconnect(connection, config);
    };

    socket.onerror = (error) => {
      this.emit('error', { url: config.url, error });
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('message', { url: config.url, message });
      } catch (error) {
        this.emit('error', { 
          url: config.url, 
          error: new Error('Failed to parse WebSocket message')
        });
      }
    };
  }

  private handleReconnect(connection: WebSocketConnection, config: Required<WebSocketConfig>): void {
    if (connection.reconnectAttempts >= config.reconnectAttempts) {
      this.emit('reconnectFailed', config.url);
      return;
    }

    connection.reconnectAttempts++;
    const delay = connection.reconnectAttempts * config.reconnectDelay;

    setTimeout(() => {
      if (!connection.isConnected) {
        connection.socket = new WebSocket(config.url);
        this.setupSocketHandlers(connection, config);
      }
    }, delay);
  }

  private setupHeartbeat(connection: WebSocketConnection, config: Required<WebSocketConfig>): void {
    this.clearHeartbeat(connection);
    connection.heartbeatTimer = setInterval(() => {
      if (connection.isConnected) {
        connection.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, config.heartbeatInterval);
  }

  private clearHeartbeat(connection: WebSocketConnection): void {
    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
      connection.heartbeatTimer = undefined;
    }
  }

  public send(url: string, message: WSMessage): void {
    const connection = this.connections.get(url);
    if (!connection) {
      throw new Error(`No WebSocket connection found for URL: ${url}`);
    }

    if (connection.isConnected) {
      connection.socket.send(JSON.stringify(message));
    } else {
      connection.messageQueue.push(message);
    }
  }

  private processMessageQueue(connection: WebSocketConnection): void {
    while (connection.messageQueue.length > 0) {
      const message = connection.messageQueue.shift();
      if (message && connection.isConnected) {
        connection.socket.send(JSON.stringify(message));
      }
    }
  }

  public disconnect(url: string): void {
    const connection = this.connections.get(url);
    if (connection) {
      this.clearHeartbeat(connection);
      connection.socket.close();
      this.connections.delete(url);
    }
  }

  public disconnectAll(): void {
    for (const [url] of this.connections) {
      this.disconnect(url);
    }
  }

  public isConnected(url: string): boolean {
    return this.connections.get(url)?.isConnected ?? false;
  }

  public getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [url, connection] of this.connections) {
      status[url] = connection.isConnected;
    }
    return status;
  }
} 