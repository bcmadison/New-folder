import { Sport, PropType, PlayerProp, Entry, Lineup } from '../types';
import { User } from '../types/core';


export interface Opportunity {
  id: string;
  market: string;
  type: 'ARBITRAGE' | 'MIDDLE' | 'LINE_VALUE';
  books: Array<{
    bookId: string;
    bookName: string;
    odds: number;
    timestamp: number;
  }>;
  expectedValue: number;
  confidence: number;
  timestamp: number;
}

interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export class APIError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIService {
  private baseUrl = 'https://api.betproai.com';
  private token: string | null = null;
  private refreshToken: string | null = null;
  private readonly TIMEOUT_MS = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor() {
    this.token = localStorage.getItem('auth_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private getHeaders(additionalHeaders: HeadersInit = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders as Record<string, string>
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: this.getHeaders(options.headers)
      });

      clearTimeout(timeoutId);

      const data: APIResponse<T> = await response.json();

      if (response.status === 401 && this.token) {
        if (retryCount < this.MAX_RETRIES) {
          await this.refreshAuthToken();
          return this.request(endpoint, options, retryCount + 1);
        } else {
          this.handleAuthError();
          throw new APIError('AUTH_ERROR', 'Authentication failed after max retries');
        }
      }

      if (!response.ok || !data.success) {
        throw new APIError(
          data.error?.code || 'UNKNOWN_ERROR',
          data.error?.message || 'An unknown error occurred',
          data.error?.details
        );
      }

      return data.data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError('TIMEOUT', 'Request timed out');
      }

      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors with retries
      if (retryCount < this.MAX_RETRIES && this.shouldRetry(error)) {
        await this.delay(this.RETRY_DELAY * Math.pow(2, retryCount));
        return this.request(endpoint, options, retryCount + 1);
      }

      throw new APIError('NETWORK_ERROR', 'Network request failed', error);
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx server errors
    return !error.response || (error.response && error.response.status >= 500);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async refreshAuthToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new APIError('AUTH_ERROR', 'No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to refresh token');
      }

      if (typeof data.data.token !== 'string' || typeof data.data.refreshToken !== 'string') {
        throw new Error('Invalid token data received');
      }

      this.token = data.data.token;
      this.refreshToken = data.data.refreshToken;
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('refresh_token', data.data.refreshToken);
    } catch (error) {
      this.handleAuthError();
      throw new APIError('AUTH_ERROR', 'Failed to refresh authentication token');
    }
  }

  private handleAuthError(): void {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    // Dispatch an event to notify the app about authentication failure
    window.dispatchEvent(new CustomEvent('auth:error'));
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; refreshToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    this.token = response.token;
    this.refreshToken = response.refreshToken;
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('refresh_token', response.refreshToken);

    return { token: response.token, user: response.user };
  }

  async register(email: string, password: string, username: string): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; refreshToken: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username })
    });

    this.token = response.token;
    this.refreshToken = response.refreshToken;
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('refresh_token', response.refreshToken);

    return { token: response.token, user: response.user };
  }

  async logout(): Promise<void> {
    if (this.token) {
      try {
        await this.request('/auth/logout', { method: 'POST' });
      } catch (error) {
        // Ignore errors during logout
      }
    }
    this.handleAuthError();
  }

  // Props endpoints
  async getProps(filters: {
    sport?: Sport;
    type?: PropType;
    minOdds?: number;
    maxOdds?: number;
  }): Promise<PlayerProp[]> {
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    );
    return this.request<PlayerProp[]>(`/props?${params}`);
  }

  async getWinningProps(): Promise<PlayerProp[]> {
    return this.request('/props/winning');
  }

  // Arbitrage endpoints
  async getArbitrageOpportunities(): Promise<Opportunity[]> {
    return this.request('/arbitrage');
  }

  // Entry endpoints
  async createEntry(props: string[], amount: number): Promise<Entry> {
    return this.request('/entries', {
      method: 'POST',
      body: JSON.stringify({ props, amount })
    });
  }

  async getEntries(): Promise<Entry[]> {
    return this.request('/entries');
  }

  // Lineup endpoints
  async saveLineup(name: string, props: string[]): Promise<Lineup> {
    return this.request('/lineups', {
      method: 'POST',
      body: JSON.stringify({ name, props })
    });
  }

  async getLineups(): Promise<Lineup[]> {
    return this.request('/lineups');
  }

  // User endpoints
  async updateProfile(data: Partial<User>): Promise<User> {
    return this.request('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
}

export const apiService = new APIService(); 