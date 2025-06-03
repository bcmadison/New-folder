import { apiService } from './api';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    bankroll: number;
  };
}

class AuthService {
  private tokenKey = 'auth_token';

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      this.setToken(response.token);
      return response;
    } catch (error) {
      throw new Error('Failed to login');
    }
  }

  async register(
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', {
        username,
        email,
        password,
      });
      this.setToken(response.token);
      return response;
    } catch (error) {
      throw new Error('Failed to register');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
      this.removeToken();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService(); 