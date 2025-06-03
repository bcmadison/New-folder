import React from 'react';
import type { PerformanceMetrics as GlobalPerformanceMetrics } from '../types';
import { formatCurrency, formatPercentage } from '../utils/odds';
import { motion } from 'framer-motion';



interface MetricItem {
  label: string;
  trend: 'up' | 'down' | 'neutral';
  value: number;
  change: number;
}

interface PerformanceMetricsProps {
  metrics: MetricItem[];
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ metrics }) => {
  const getTrendIcon = (trend: MetricItem['trend']) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const formatValue = (value: number | string) => {
    if (typeof value === 'number') {
      if (Math.abs(value) > 100) {
        return formatCurrency(value);
      }
      return formatPercentage(value / 100);
    }
    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {metrics.map((metric, index) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg backdrop-blur-lg backdrop-filter bg-opacity-90"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {metric.label}
            </h3>
            {getTrendIcon(metric.trend)}
          </div>

          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {formatValue(metric.value)}
            </p>
            <p className={`ml-2 text-sm ${
              metric.change > 0 ? 'text-green-600 dark:text-green-400' :
              metric.change < 0 ? 'text-red-600 dark:text-red-400' :
              'text-gray-500 dark:text-gray-400'
            }`}>
              {metric.change > 0 ? '+' : ''}{formatPercentage(metric.change / 100)}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PerformanceMetrics; 