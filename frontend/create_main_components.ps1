# Script to create main components
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

Write-Host "📝 Creating main components..." -ForegroundColor Cyan

# SmartLineupBuilder Component
Write-FileContent -Path "src/components/lineup/SmartLineupBuilder.tsx" -Content @'
import { useState, useMemo } from 'react';
import { Player } from '@/services/api';
import { useLineupAPI } from '@/hooks/useLineupAPI';
import { useSportsFilter } from '@/hooks/useSportsFilter';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

interface SmartLineupBuilderProps {
  onLineupSubmit: (players: Player[]) => void;
  className?: string;
}

export function SmartLineupBuilder({ onLineupSubmit, className = '' }: SmartLineupBuilderProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const { selectedSport } = useSportsFilter();
  const { players, isLoading, error, submitLineup, isSubmitting } = useLineupAPI({
    onSuccess: () => {
      onLineupSubmit(selectedPlayers);
    },
  });

  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    return players.filter(player => player.sport === selectedSport);
  }, [players, selectedSport]);

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      }
      return [...prev, player];
    });
  };

  const handleSubmit = () => {
    if (selectedPlayers.length > 0) {
      submitLineup(selectedPlayers);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map(player => (
          <div
            key={player.id}
            className={`cursor-pointer rounded-lg border p-4 transition-colors ${
              selectedPlayers.some(p => p.id === player.id)
                ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                : 'border-gray-200 hover:border-primary-500 dark:border-gray-700'
            }`}
            onClick={() => handlePlayerSelect(player)}
          >
            <div className="font-medium">{player.name}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {player.position} • {player.team}
            </div>
            <div className="mt-2 text-sm">
              <span className="font-medium">Projected: </span>
              {player.projectedPoints.toFixed(1)}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={selectedPlayers.length === 0 || isSubmitting}
        className="w-full rounded-lg bg-primary-500 px-4 py-2 font-semibold text-white hover:bg-primary-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Lineup'}
      </button>
    </div>
  );
}
'@

# SmartControlsBar Component
Write-FileContent -Path "src/components/controls/SmartControlsBar.tsx" -Content @'
import { useSportsFilter } from '@/hooks/useSportsFilter';
import { useTheme } from '@/hooks/useTheme';

interface SmartControlsBarProps {
  className?: string;
}

export function SmartControlsBar({ className = '' }: SmartControlsBarProps) {
  const { selectedSport, setSelectedSport } = useSportsFilter();
  const { theme, setTheme } = useTheme();

  const sports = [
    { id: 'all', name: 'All Sports' },
    { id: 'nba', name: 'NBA' },
    { id: 'wnba', name: 'WNBA' },
    { id: 'mlb', name: 'MLB' },
    { id: 'nhl', name: 'NHL' },
    { id: 'soccer', name: 'Soccer' },
  ];

  const themes = [
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'system', name: 'System' },
  ];

  return (
    <div className={`bg-white px-4 py-3 dark:bg-gray-800 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          >
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          >
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-gray-100 p-2 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
'@

# Common Components
Write-FileContent -Path "src/components/common/LoadingSpinner.tsx" -Content @'
export function LoadingSpinner() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
    </div>
  );
}
'@

Write-FileContent -Path "src/components/common/ErrorMessage.tsx" -Content @'
interface ErrorMessageProps {
  error: Error | unknown;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  const message = error instanceof Error ? error.message : "An error occurred";

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
      <div className="flex items-center">
        <svg
          className="h-5 w-5 text-red-400 dark:text-red-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <span className="ml-2 font-medium text-red-800 dark:text-red-200">
          {message}
        </span>
      </div>
    </div>
  );
}
'@

Write-Host "✅ Main components created successfully!" -ForegroundColor Green 