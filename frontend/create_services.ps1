# Script to create services
$ErrorActionPreference = "Stop"

# Function to write content to a file
function Write-FileContent {
    param(
        [string]$Path,
        [string]$Content
    )
    
    try {
        $directory = Split-Path -Path $Path -Parent
        if (-not (Test-Path -Path $directory)) {
            New-Item -ItemType Directory -Path $directory -Force | Out-Null
        }
        [System.IO.File]::WriteAllText($Path, $Content, [System.Text.Encoding]::UTF8)
        Write-Host "Created file: $Path" -ForegroundColor Green
    }
    catch {
        Write-Host "Error creating file $Path : $_" -ForegroundColor Red
    }
}

Write-Host "🔧 Creating services..." -ForegroundColor Cyan

# API Types
Write-FileContent -Path "src/services/api/types.ts" -Content @'
export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  projectedPoints: number;
  salary: number;
  confidence: number;
}

export interface Bet {
  id: string;
  title: string;
  description: string;
  odds: string;
  confidence: number;
  potentialReturn: number;
}

export interface BettingRecord {
  date: string;
  description: string;
  amount: number;
  outcome: 'win' | 'loss';
  profit: number;
}

export interface PerformanceData {
  date: string;
  actualValue: number;
  predictedValue: number;
}

export interface AccuracyData {
  category: string;
  accuracy: number;
}

export interface BettingInsight {
  category: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence?: number;
  recommendation?: string;
}

export interface APIError extends Error {
  code?: string;
  status?: number;
  data?: any;
}
'@

# API Client
Write-FileContent -Path "src/services/api/client.ts" -Content @'
import axios from 'axios';
import type { APIError } from './types';

const baseURL = process.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError: APIError = new Error(
      error.response?.data?.message || 'An unexpected error occurred'
    );
    
    apiError.code = error.response?.data?.code;
    apiError.status = error.response?.status;
    apiError.data = error.response?.data;

    // Handle token expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    return Promise.reject(apiError);
  }
);
'@

# WebSocket Service
Write-FileContent -Path "src/services/websocket/index.ts" -Content @'
type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Event) => void;
type StatusHandler = () => void;

interface WebSocketOptions {
  onMessage?: MessageHandler;
  onError?: ErrorHandler;
  onClose?: StatusHandler;
  onOpen?: StatusHandler;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private closeHandlers: Set<StatusHandler> = new Set();
  private openHandlers: Set<StatusHandler> = new Set();

  constructor(
    private url: string,
    private options: WebSocketOptions = {}
  ) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.openHandlers.forEach(handler => handler());
        this.options.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.messageHandlers.forEach(handler => handler(data));
          this.options.onMessage?.(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        this.errorHandlers.forEach(handler => handler(error));
        this.options.onError?.(error);
      };

      this.ws.onclose = () => {
        this.closeHandlers.forEach(handler => handler());
        this.options.onClose?.();

        if (this.options.autoReconnect && this.shouldReconnect()) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      if (this.options.autoReconnect && this.shouldReconnect()) {
        this.scheduleReconnect();
      }
    }
  }

  private shouldReconnect(): boolean {
    const maxAttempts = this.options.maxReconnectAttempts ?? 5;
    return this.reconnectAttempts < maxAttempts;
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const interval = this.options.reconnectInterval ?? 5000;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, interval);
  }

  public send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  public addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.add(handler);
  }

  public removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers.delete(handler);
  }

  public addErrorHandler(handler: ErrorHandler) {
    this.errorHandlers.add(handler);
  }

  public removeErrorHandler(handler: ErrorHandler) {
    this.errorHandlers.delete(handler);
  }

  public addCloseHandler(handler: StatusHandler) {
    this.closeHandlers.add(handler);
  }

  public removeCloseHandler(handler: StatusHandler) {
    this.closeHandlers.delete(handler);
  }

  public addOpenHandler(handler: StatusHandler) {
    this.openHandlers.add(handler);
  }

  public removeOpenHandler(handler: StatusHandler) {
    this.openHandlers.delete(handler);
  }

  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.messageHandlers.clear();
    this.errorHandlers.clear();
    this.closeHandlers.clear();
    this.openHandlers.clear();
  }
}
'@

# Analytics Service
Write-FileContent -Path "src/services/analytics/index.ts" -Content @'
import { api } from '../api/client';
import type { PerformanceData, AccuracyData } from '../api/types';

export type TimeRange = '1d' | '7d' | '30d' | '90d' | 'all';

interface AnalyticsResponse {
  performance: PerformanceData[];
  accuracy: AccuracyData[];
  metrics: {
    totalPredictions: number;
    successRate: number;
    averageEdge: number;
    roi: number;
  };
}

export class AnalyticsService {
  static async getAnalytics(timeRange: TimeRange): Promise<AnalyticsResponse> {
    const response = await api.get(`/analytics?timeRange=${timeRange}`);
    return response.data;
  }

  static async getPerformance(timeRange: TimeRange): Promise<PerformanceData[]> {
    const response = await api.get(`/analytics/performance?timeRange=${timeRange}`);
    return response.data;
  }

  static async getAccuracy(timeRange: TimeRange): Promise<AccuracyData[]> {
    const response = await api.get(`/analytics/accuracy?timeRange=${timeRange}`);
    return response.data;
  }

  static async exportData(timeRange: TimeRange, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const response = await api.get(`/analytics/export?timeRange=${timeRange}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}
'@

Write-Host "✅ Services created successfully!" -ForegroundColor Green 