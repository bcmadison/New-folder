import { AppStore } from '../useAppStore'; // Import AppStore for full store type
import { StateCreator } from 'zustand';
import { User as FrontendUser } from '../../types';
import { unifiedMonitor } from '../../core/UnifiedMonitor';


const TOKEN_STORAGE_KEY = 'authToken';

export interface AuthSlice {
  user: FrontendUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // For login, logout, and initialization processes
  error: string | null;
  webSocketAuthStatus: 'pending' | 'success' | 'failure' | 'required' | null;
  webSocketClientId: string | null; // Added for persisting WebSocket client ID
  initializeAuth: () => Promise<void>; // New action for session re-hydration
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>; // Made async to align with authService.logout
  setUser: (user: FrontendUser | null) => void; // Kept for direct manipulation if needed
  setToken: (token: string | null) => void; // For direct token manipulation
  setWebSocketAuthStatus: (status: AuthSlice['webSocketAuthStatus']) => void;
  setWebSocketClientId: (clientId: string | null) => void; // Added setter
}

// ADDED: Exportable initial state for AuthSlice
export const initialAuthState: Omit<AuthSlice, 'initializeAuth' | 'login' | 'logout' | 'setUser' | 'setToken' | 'setWebSocketAuthStatus' | 'setWebSocketClientId'> = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  webSocketAuthStatus: null,
  webSocketClientId: null,
};

// Helper to get the authService (can be overridden in tests)
export async function getAuthService() { return (await import('../../services/authService')).authService; }

export const createAuthSlice: StateCreator<
  AppStore, 
  [], 
  [], 
  AuthSlice
> = (set, get) => ({ // Uses the initial state properties directly
  ...initialAuthState,
  // Functions are defined below
  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      set({ token }); // Set token in store immediately
      try {
        const authService = await getAuthService();
        const user = await authService.fetchCurrentUser();
        set({ user, isAuthenticated: true, isLoading: false });
        unifiedMonitor.setUserContext(user);
        get().setWebSocketAuthStatus('required'); 
      } catch (error: any) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: 'Session expired. Please log in again.' });
        unifiedMonitor.setUserContext(null);
        unifiedMonitor.reportError(error, { operation: 'initializeAuth', detail: 'Failed to fetch current user with stored token' });
      }
    } else {
      set({ isLoading: false }); // No token, not loading
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const authService = await getAuthService();
      const result = await authService.login(credentials);
      if (!result || !result.user || !result.token) {
        throw new Error('Invalid login response from server.');
      }
      const { user, token } = result;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      unifiedMonitor.setUserContext(user);
      unifiedMonitor.captureMessage('User logged in', 'info', { userId: user.id });
      get().setWebSocketAuthStatus('required'); // WebSocket might need re-auth
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      set({ isLoading: false, error: errorMessage, isAuthenticated: false, user: null, token: null });
      unifiedMonitor.reportError(error, { operation: 'authSlice.login', email: credentials.email });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    const currentToken = get().token;
    try {
      if (currentToken) {
        const authService = await getAuthService();
        await authService.logout(); // Call backend logout
      }
    } catch (logoutError: any) {
        unifiedMonitor.reportError(logoutError, { operation: 'authSlice.logout', detail: 'Backend logout call failed'}, 'warning');
    } finally {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null, webSocketAuthStatus: null });
        unifiedMonitor.setUserContext(null);
        unifiedMonitor.captureMessage('User logged out', 'info');
    }
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({token}),

  setWebSocketAuthStatus: (status) => set({ webSocketAuthStatus: status }),
  setWebSocketClientId: (clientId) => set({ webSocketClientId: clientId }), // Implement setter
}); 