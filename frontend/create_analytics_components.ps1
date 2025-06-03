# Script to create analytics components
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

Write-Host "📊 Creating analytics components..." -ForegroundColor Cyan

# PerformanceChart Component
Write-FileContent -Path "src/components/analytics/PerformanceChart.tsx" -Content @'
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { PerformanceData } from '@/services/api';

interface PerformanceChartProps {
  data: PerformanceData[];
  className?: string;
}

export function PerformanceChart({ data, className = '' }: PerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const dates = data.map(d => new Date(d.date).toLocaleDateString());
    const actualValues = data.map(d => d.actualValue);
    const predictedValues = data.map(d => d.predictedValue);

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Actual',
            data: actualValues,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
          },
          {
            label: 'Predicted',
            data: predictedValues,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'rgb(156, 163, 175)',
            },
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
            },
          },
          y: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className={`relative h-[400px] ${className}`}>
      <canvas ref={chartRef} />
    </div>
  );
}
'@

# ROIAnalysis Component
Write-FileContent -Path "src/components/analytics/ROIAnalysis.tsx" -Content @'
import { useMemo } from 'react';
import { BettingHistory } from '@/services/api';

interface ROIAnalysisProps {
  history: BettingHistory[];
  className?: string;
}

export function ROIAnalysis({ history, className = '' }: ROIAnalysisProps) {
  const stats = useMemo(() => {
    const totalBets = history.length;
    const totalInvestment = history.reduce((sum, bet) => sum + bet.stake, 0);
    const totalReturns = history.reduce((sum, bet) => sum + (bet.won ? bet.payout : 0), 0);
    const roi = totalInvestment > 0 ? ((totalReturns - totalInvestment) / totalInvestment) * 100 : 0;
    const winRate = (history.filter(bet => bet.won).length / totalBets) * 100;

    return {
      totalBets,
      totalInvestment,
      totalReturns,
      roi,
      winRate,
    };
  }, [history]);

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <h2 className="text-xl font-semibold">ROI Analysis</h2>
      
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Bets</div>
          <div className="text-2xl font-bold">{stats.totalBets}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
          <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Investment</div>
          <div className="text-2xl font-bold">${stats.totalInvestment.toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Returns</div>
          <div className="text-2xl font-bold">${stats.totalReturns.toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">ROI</div>
          <div className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-success-500' : 'text-red-500'}`}>
            {stats.roi.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
'@

# PredictionAccuracy Component
Write-FileContent -Path "src/components/analytics/PredictionAccuracy.tsx" -Content @'
import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { AccuracyData } from '@/services/api';

interface PredictionAccuracyProps {
  data: AccuracyData[];
  className?: string;
}

export function PredictionAccuracy({ data, className = '' }: PredictionAccuracyProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const categories = data.map(d => d.category);
    const accuracyValues = data.map(d => d.accuracy * 100);

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Prediction Accuracy',
          data: accuracyValues,
          backgroundColor: accuracyValues.map(value => 
            value >= 70 ? 'rgba(34, 197, 94, 0.6)' :
            value >= 50 ? 'rgba(234, 179, 8, 0.6)' :
            'rgba(239, 68, 68, 0.6)'
          ),
          borderColor: accuracyValues.map(value =>
            value >= 70 ? 'rgb(34, 197, 94)' :
            value >= 50 ? 'rgb(234, 179, 8)' :
            'rgb(239, 68, 68)'
          ),
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `Accuracy: ${context.raw.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
            },
          },
          y: {
            grid: {
              color: 'rgba(156, 163, 175, 0.1)',
            },
            ticks: {
              color: 'rgb(156, 163, 175)',
              callback: (value) => `${value}%`,
            },
            min: 0,
            max: 100,
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className={`relative h-[300px] ${className}`}>
      <canvas ref={chartRef} />
    </div>
  );
}
'@

Write-Host "✅ Analytics components created successfully!" -ForegroundColor Green 