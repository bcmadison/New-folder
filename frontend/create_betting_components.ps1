# Script to create betting components
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

Write-Host "🎲 Creating betting components..." -ForegroundColor Cyan

# BettingCard Component
Write-FileContent -Path "src/components/betting/BettingCard.tsx" -Content @'
import { useMemo } from 'react';
import { Bet } from '@/services/api';

interface BettingCardProps {
  bet: Bet;
  onPlaceBet: (amount: number) => void;
  className?: string;
}

export function BettingCard({ bet, onPlaceBet, className = '' }: BettingCardProps) {
  const confidenceColor = useMemo(() => {
    if (bet.confidence >= 0.7) return 'text-success-500';
    if (bet.confidence >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  }, [bet.confidence]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = Number(formData.get('amount'));
    if (amount > 0) {
      onPlaceBet(amount);
    }
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{bet.title}</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{bet.description}</p>
        </div>
        <div className={`text-right ${confidenceColor}`}>
          <div className="text-sm font-medium">Confidence</div>
          <div className="text-2xl font-bold">{(bet.confidence * 100).toFixed(1)}%</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Odds</div>
          <div className="text-lg font-medium">{bet.odds}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Potential Return</div>
          <div className="text-lg font-medium text-success-500">
            {bet.potentialReturn.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="amount" className="sr-only">
              Bet Amount
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                name="amount"
                id="amount"
                min="1"
                step="1"
                required
                className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-12 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                placeholder="0.00"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary-500 px-4 py-2 font-semibold text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Place Bet
          </button>
        </div>
      </form>
    </div>
  );
}
'@

# BettingHistory Component
Write-FileContent -Path "src/components/betting/BettingHistory.tsx" -Content @'
import { useMemo } from 'react';
import { BettingRecord } from '@/services/api';

interface BettingHistoryProps {
  records: BettingRecord[];
  className?: string;
}

export function BettingHistory({ records, className = '' }: BettingHistoryProps) {
  const stats = useMemo(() => {
    const total = records.length;
    const wins = records.filter(r => r.outcome === 'win').length;
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const profit = records.reduce((sum, r) => sum + r.profit, 0);

    return { total, wins, winRate, profit };
  }, [records]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Bets</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Wins</div>
          <div className="text-2xl font-bold">{stats.wins}</div>
        </div>
        <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
          <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="rounded-lg bg-white p-4 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Profit</div>
          <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-success-500' : 'text-red-500'}`}>
            {stats.profit.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              signDisplay: 'always',
            })}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Bet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Outcome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {records.map((record, index) => (
                <tr key={index}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">{record.description}</td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {record.amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        record.outcome === 'win'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                    >
                      {record.outcome.toUpperCase()}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 font-medium ${
                      record.profit >= 0 ? 'text-success-500' : 'text-red-500'
                    }`}
                  >
                    {record.profit.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      signDisplay: 'always',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
'@

# BettingInsights Component
Write-FileContent -Path "src/components/betting/BettingInsights.tsx" -Content @'
import { useMemo } from 'react';
import { BettingInsight } from '@/services/api';

interface BettingInsightsProps {
  insights: BettingInsight[];
  className?: string;
}

export function BettingInsights({ insights, className = '' }: BettingInsightsProps) {
  const categorizedInsights = useMemo(() => {
    return insights.reduce((acc, insight) => {
      if (!acc[insight.category]) {
        acc[insight.category] = [];
      }
      acc[insight.category].push(insight);
      return acc;
    }, {} as Record<string, BettingInsight[]>);
  }, [insights]);

  const getInsightColor = (impact: 'positive' | 'negative' | 'neutral') => {
    switch (impact) {
      case 'positive':
        return 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-900/50';
      case 'negative':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-900/50';
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {Object.entries(categorizedInsights).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-4 text-lg font-semibold">{category}</h3>
          <div className="space-y-4">
            {items.map((insight, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${getInsightColor(insight.impact)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {insight.description}
                    </p>
                  </div>
                  {insight.confidence && (
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Confidence
                      </div>
                      <div className="text-lg font-semibold">
                        {(insight.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
                {insight.recommendation && (
                  <div className="mt-4 rounded-lg bg-white/50 p-3 dark:bg-black/20">
                    <div className="text-sm font-medium">Recommendation</div>
                    <div className="mt-1 text-sm">{insight.recommendation}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
'@

Write-Host "✅ Betting components created successfully!" -ForegroundColor Green 