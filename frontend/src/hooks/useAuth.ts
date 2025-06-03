import useStore from '../store/useStore';
import { User } from '../types';
import { apiService } from '../services/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';


interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials extends LoginCredentials {
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<User>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await apiService.login(credentials.email, credentials.password);
          localStorage.setItem('auth_token', token);
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      register: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { token, user } = await apiService.register(credentials.email, credentials.password, credentials.username);
          localStorage.setItem('auth_token', token);
          set({ user, isAuthenticated: true, isLoading: false });
          return user;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, isAuthenticated: false });
      },
      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const updatedUser = await apiService.updateProfile(data);
          set({ user: updatedUser, isLoading: false });
          return updatedUser;
        } catch (error) {
          set({ error: (error as Error).message, isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
); 