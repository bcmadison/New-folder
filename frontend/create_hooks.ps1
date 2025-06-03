# Script to create hooks
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

Write-Host "🎣 Creating hooks..." -ForegroundColor Cyan

# useTheme Hook
Write-FileContent -Path "src/hooks/useTheme.ts" -Content @'
import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage',
    }
  )
);

export function useTheme() {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
        root.classList.toggle('dark', systemTheme === 'dark');
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
}
'@

# useSportsFilter Hook
Write-FileContent -Path "src/hooks/useSportsFilter.ts" -Content @'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SportsFilterState {
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
}

const useSportsFilterStore = create<SportsFilterState>()(
  persist(
    (set) => ({
      selectedSport: 'all',
      setSelectedSport: (sport) => set({ selectedSport: sport }),
    }),
    {
      name: 'sports-filter-storage',
    }
  )
);

export function useSportsFilter() {
  const { selectedSport, setSelectedSport } = useSportsFilterStore();
  return { selectedSport, setSelectedSport };
}
'@

# useLineupAPI Hook
Write-FileContent -Path "src/hooks/useLineupAPI.ts" -Content @'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Player } from '@/services/api';

interface UseLineupAPIOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useLineupAPI(options: UseLineupAPIOptions = {}) {
  const queryClient = useQueryClient();

  const {
    data: players,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await api.get('/players');
      return response.data;
    },
  });

  const submitLineup = useMutation({
    mutationFn: async (selectedPlayers: Player[]) => {
      const response = await api.post('/lineup/submit', {
        players: selectedPlayers.map(p => p.id),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options.onError?.(error);
    },
  });

  return {
    players,
    isLoading,
    error,
    submitLineup: submitLineup.mutate,
    isSubmitting: submitLineup.isPending,
  };
}
'@

# useAnalytics Hook
Write-FileContent -Path "src/hooks/useAnalytics.ts" -Content @'
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export type TimeRange = '1d' | '7d' | '30d' | '90d' | 'all';

interface UseAnalyticsOptions {
  timeRange?: TimeRange;
  enabled?: boolean;
}

export function useAnalytics({ timeRange = '7d', enabled = true }: UseAnalyticsOptions = {}) {
  return useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics?timeRange=${timeRange}`);
      return response.data;
    },
    enabled,
  });
}
'@

# useBetting Hook
Write-FileContent -Path "src/hooks/useBetting.ts" -Content @'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

interface PlaceBetParams {
  betId: string;
  amount: number;
}

export function useBetting() {
  const queryClient = useQueryClient();

  const {
    data: bettingData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['betting'],
    queryFn: async () => {
      const response = await api.get('/betting');
      return response.data;
    },
  });

  const placeBet = useMutation({
    mutationFn: async ({ betId, amount }: PlaceBetParams) => {
      const response = await api.post(`/betting/${betId}/place`, { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['betting'] });
    },
  });

  return {
    bettingData,
    isLoading,
    error,
    placeBet: placeBet.mutate,
    isPlacingBet: placeBet.isPending,
  };
}
'@

Write-Host "✅ Hooks created successfully!" -ForegroundColor Green 