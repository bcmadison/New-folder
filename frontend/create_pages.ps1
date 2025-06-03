# Script to create pages
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

Write-Host "📄 Creating pages..." -ForegroundColor Cyan

# Dashboard Page
Write-FileContent -Path "src/pages/Dashboard.tsx" -Content @'
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { ROIAnalysis } from '@/components/analytics/ROIAnalysis';
import { PredictionAccuracy } from '@/components/analytics/PredictionAccuracy';
import { BettingInsights } from '@/components/betting/BettingInsights';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export function Dashboard() {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PerformanceChart
          data={dashboardData.performance}
          className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        />
        <ROIAnalysis
          history={dashboardData.bettingHistory}
          className="lg:row-span-2"
        />
        <PredictionAccuracy
          data={dashboardData.accuracy}
          className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>

      <BettingInsights
        insights={dashboardData.insights}
        className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
      />
    </div>
  );
}
'@

# Betting Page
Write-FileContent -Path "src/pages/Betting.tsx" -Content @'
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { BettingCard } from '@/components/betting/BettingCard';
import { BettingHistory } from '@/components/betting/BettingHistory';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

export function Betting() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const { data: bettingData, isLoading, error } = useQuery({
    queryKey: ['betting'],
    queryFn: async () => {
      const response = await api.get('/betting');
      return response.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Betting</h1>
        <div className="flex rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'active'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Active Bets
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'history'
                ? 'bg-primary-500 text-white'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'active' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {bettingData.activeBets.map((bet) => (
            <BettingCard
              key={bet.id}
              bet={bet}
              onPlaceBet={async (amount) => {
                await api.post(`/betting/${bet.id}/place`, { amount });
                // Refetch betting data
                // queryClient.invalidateQueries(['betting']);
              }}
            />
          ))}
        </div>
      ) : (
        <BettingHistory records={bettingData.history} />
      )}
    </div>
  );
}
'@

# Analytics Page
Write-FileContent -Path "src/pages/Analytics.tsx" -Content @'
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { PerformanceChart } from '@/components/analytics/PerformanceChart';
import { PredictionAccuracy } from '@/components/analytics/PredictionAccuracy';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

type TimeRange = '1d' | '7d' | '30d' | '90d' | 'all';

export function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics?timeRange=${timeRange}`);
      return response.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {(['1d', '7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === range
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Performance Over Time</h2>
          <PerformanceChart data={analyticsData.performance} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Prediction Accuracy by Category</h2>
          <PredictionAccuracy data={analyticsData.accuracy} />
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold">Key Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Predictions</div>
              <div className="text-2xl font-bold">{analyticsData.metrics.totalPredictions}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
              <div className="text-2xl font-bold">
                {analyticsData.metrics.successRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Average Edge</div>
              <div className="text-2xl font-bold">
                {analyticsData.metrics.averageEdge.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">ROI</div>
              <div className={`text-2xl font-bold ${
                analyticsData.metrics.roi >= 0 ? 'text-success-500' : 'text-red-500'
              }`}>
                {analyticsData.metrics.roi.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'@

Write-Host "✅ Pages created successfully!" -ForegroundColor Green 