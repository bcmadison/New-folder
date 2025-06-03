import { create } from 'zustand';
import { Bet, Event, User, Analytics } from '@/types';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Events state
  events: Event[];
  setEvents: (events: Event[]) => void;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  
  // Bets state
  bets: Bet[];
  setBets: (bets: Bet[]) => void;
  addBet: (bet: Bet) => void;
  updateBet: (bet: Bet) => void;
  
  // Analytics state
  analytics: Analytics | null;
  setAnalytics: (analytics: Analytics | null) => void;
  
  // UI state
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  // Events state
  events: [],
  setEvents: (events) => set({ events }),
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  updateEvent: (event) => set((state) => ({
    events: state.events.map((e) => (e.id === event.id ? event : e)),
  })),
  
  // Bets state
  bets: [],
  setBets: (bets) => set({ bets }),
  addBet: (bet) => set((state) => ({ bets: [...state.bets, bet] })),
  updateBet: (bet) => set((state) => ({
    bets: state.bets.map((b) => (b.id === bet.id ? bet : b)),
  })),
  
  // Analytics state
  analytics: null,
  setAnalytics: (analytics) => set({ analytics }),
  
  // UI state
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  error: null,
  setError: (error) => set({ error }),
})); 