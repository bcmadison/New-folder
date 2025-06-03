import { useSportsFilter } from '@/hooks/useSportsFilter';
import { useQueryClient } from '@tanstack/react-query';
import { LINEUP_QUERY_KEY } from '@/hooks/useLineupAPI';
import { PREDICTIONS_QUERY_KEY } from '@/hooks/usePredictions';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface SmartControlsBarProps {
  className?: string;
}

export function SmartControlsBar({ className = '' }: SmartControlsBarProps) {
  const { sports, activeSport, setActiveSport } = useSportsFilter();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: LINEUP_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: PREDICTIONS_QUERY_KEY });
  };

  return (
    <div
      className={`flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${className}`}
    >
      <div className="flex items-center space-x-4">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setActiveSport(sport)}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 transition-colors ${
              activeSport?.id === sport.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-xl">{sport.icon}</span>
            <span className="font-medium">{sport.name}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          <ArrowPathIcon className="h-5 w-5" />
          <span>Refresh Data</span>
        </button>

        {/* Add more global controls here */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Confidence Threshold:</span>
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
            defaultValue="0"
          >
            <option value="0">All</option>
            <option value="0.7">70%+</option>
            <option value="0.8">80%+</option>
            <option value="0.9">90%+</option>
          </select>
        </div>
      </div>
    </div>
  );
} 