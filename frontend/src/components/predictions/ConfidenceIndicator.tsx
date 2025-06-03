import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConfidenceIndicatorProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceIndicator({
  confidence,
  size = 'md',
  showLabel = true,
  className = '',
}: ConfidenceIndicatorProps) {
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'h-2 w-20';
      case 'lg':
        return 'h-4 w-32';
      default:
        return 'h-3 w-24';
    }
  }, [size]);

  const confidenceColor = useMemo(() => {
    if (confidence >= 0.8) return 'bg-success-500';
    if (confidence >= 0.6) return 'bg-primary-500';
    if (confidence >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  }, [confidence]);

  const labelColor = useMemo(() => {
    if (confidence >= 0.8) return 'text-success-700 dark:text-success-400';
    if (confidence >= 0.6) return 'text-primary-700 dark:text-primary-400';
    if (confidence >= 0.4) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-red-700 dark:text-red-400';
  }, [confidence]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${sizeClasses}`}>
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${confidenceColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-medium ${labelColor}`}>{Math.round(confidence * 100)}%</span>
      )}
    </div>
  );
} 