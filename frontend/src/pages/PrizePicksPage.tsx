import ESPNHeadlinesTicker from '../components/modern/ESPNHeadlinesTicker';
import PropCards from '../components/modern/PropCards';
import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { PrizePicksService } from '../services/prizePicksService';
import { ProcessedPrizePicksProp } from '../types/prizePicks';


const PrizePicksPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'high-confidence' | 'trending'>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'time' | 'picks'>('confidence');
  const [props, setProps] = useState<ProcessedPrizePicksProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = PrizePicksService.getInstance();
    let interval: NodeJS.Timeout;

    const loadProps = async () => {
      try {
        setLoading(true);
        let filteredProps = await service.getFilteredProps(filter);
        
        // Sort props
        filteredProps = filteredProps.sort((a, b) => {
          if (sortBy === 'confidence') {
            return b.winningProp.percentage - a.winningProp.percentage;
          } else if (sortBy === 'time') {
            return new Date(b.game_time).getTime() - new Date(a.game_time).getTime();
          } else {
            return parseInt(b.pick_count) - parseInt(a.pick_count);
          }
        });

        setProps(filteredProps);
        setError(null);
      } catch (err) {
        setError('Failed to load props. Please try again later.');
        console.error('Error loading props:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProps();
    interval = setInterval(loadProps, 30000); // Refresh every 30 seconds

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter, sortBy]);

  return (
    <main className="section space-y-6 lg:space-y-8 animate-fade-in">
      {/* ESPN Headlines */}
      <ESPNHeadlinesTicker />

      {/* Filters */}
      <div className="modern-card p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-2xl lg:text-3xl font-bold">🎯 PrizePicks Props</h1>
          
          <div className="flex flex-wrap gap-4">
            {/* Filter buttons */}
            <div className="flex rounded-lg overflow-hidden">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                All Props
              </button>
              <button
                onClick={() => setFilter('high-confidence')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'high-confidence'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                High Confidence
              </button>
              <button
                onClick={() => setFilter('trending')}
                className={`px-4 py-2 text-sm font-medium ${
                  filter === 'trending'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Trending
              </button>
            </div>

            {/* Sort dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'confidence' | 'time' | 'picks')}
              className="modern-input text-sm"
            >
              <option value="confidence">Sort by Confidence</option>
              <option value="time">Sort by Game Time</option>
              <option value="picks">Sort by Pick Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="modern-card p-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="modern-card p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading props...</p>
        </div>
      )}

      {/* Props grid */}
      {!loading && !error && (
        <PropCards props={props} />
      )}

      {/* Empty state */}
      {!loading && !error && props.length === 0 && (
        <div className="modern-card p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No props available for the selected filter.</p>
        </div>
      )}
    </main>
  );
};

export default PrizePicksPage; 