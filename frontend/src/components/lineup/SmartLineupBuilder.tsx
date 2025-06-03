import { useState, useMemo } from 'react';
import { useLineupAPI } from '@/hooks/useLineupAPI';
import { usePredictions } from '@/hooks/usePredictions';
import { useSportsFilter } from '@/hooks/useSportsFilter';
import { Player } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartLineupBuilderProps {
  onLineupSubmit?: (players: Player[]) => void;
  className?: string;
}

export function SmartLineupBuilder({ onLineupSubmit, className = '' }: SmartLineupBuilderProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [filters, setFilters] = useState({
    position: '',
    team: '',
    minSalary: 0,
    maxSalary: 50000,
    minConfidence: 0,
    searchTerm: '',
  });

  const { players, isLoading, filterPlayers, validateLineup, submitLineup } = useLineupAPI();
  const { getPlayerPrediction, getConfidenceColor } = usePredictions();
  const { activeSport } = useSportsFilter();

  const filteredPlayers = useMemo(() => filterPlayers(filters), [filterPlayers, filters]);

  const { isValid, errors, totalSalary } = useMemo(
    () => validateLineup(selectedPlayers),
    [validateLineup, selectedPlayers]
  );

  const handlePlayerSelect = (player: Player) => {
    if (selectedPlayers.find((p) => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p.id !== player.id));
    } else {
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || !activeSport) return;

    try {
      await submitLineup({
        players: selectedPlayers.map((p) => p.id),
        sport: activeSport.id,
      });
      onLineupSubmit?.(selectedPlayers);
    } catch (error) {
      console.error('Failed to submit lineup:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col gap-4 ${className}`}>
      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <input
          type="text"
          placeholder="Search players..."
          className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
          value={filters.searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
        />
        <select
          value={filters.position}
          onChange={(e) => setFilters({ ...filters, position: e.target.value })}
          className="rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
        >
          <option value="">All Positions</option>
          {['QB', 'RB', 'WR', 'TE', 'FLEX', 'DST'].map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        {/* Add more filters as needed */}
      </div>

      {/* Players Grid */}
      <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredPlayers.map((player) => {
            const prediction = getPlayerPrediction(player.id);
            const isSelected = selectedPlayers.some((p) => p.id === player.id);
            const confidenceColor = getConfidenceColor(player.confidence);

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 bg-white hover:border-primary-200 dark:border-gray-700 dark:bg-gray-800'
                }`}
                onClick={() => handlePlayerSelect(player)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{player.name}</h3>
                  <span className="text-sm text-gray-500">{player.position}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ${player.salary.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${confidenceColor}`}>
                    {(player.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                {prediction && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Projected: {prediction.projectedPoints.toFixed(1)} pts
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Selected Players & Submit */}
      <div className="mt-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Selected Players ({selectedPlayers.length})</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Salary: ${totalSalary.toLocaleString()} / $50,000
          </p>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
            <ul className="list-inside list-disc text-sm text-red-600 dark:text-red-400">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className={`w-full rounded-lg px-4 py-2 font-medium text-white transition-colors ${
            isValid
              ? 'bg-primary-500 hover:bg-primary-600'
              : 'cursor-not-allowed bg-gray-400 dark:bg-gray-600'
          }`}
        >
          Submit Lineup
        </button>
      </div>
    </div>
  );
} 