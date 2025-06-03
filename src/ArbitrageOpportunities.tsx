import React, { useState, useEffect } from 'react';
import { Sport, PropType } from '../types';
import { formatCurrency } from '../utils/odds';
import { motion, AnimatePresence } from 'framer-motion';



interface Book {
  name: string;
  odds: number;
  line: number;
}

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
}

interface Opportunity {
  id: string;
  sport: Sport;
  player: Player;
  propType: PropType;
  books: Book[];
  potentialProfit: number;
  expiresAt: string;
}

interface ArbitrageOpportunitiesProps {
  opportunities: Opportunity[];
  onSelect?: (opportunity: Opportunity) => void;
}

const ArbitrageOpportunities: React.FC<ArbitrageOpportunitiesProps> = ({
  opportunities,
  onSelect
}) => {
  const [sortedOpportunities, setSortedOpportunities] = useState<Opportunity[]>([]);
  const [sortBy, setSortBy] = useState<'profit' | 'time'>('profit');

  useEffect(() => {
    const sorted = [...opportunities].sort((a, b) => {
      if (sortBy === 'profit') {
        return b.potentialProfit - a.potentialProfit;
      }
      return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
    });
    setSortedOpportunities(sorted);
  }, [opportunities, sortBy]);

  const getTimeRemaining = (expiresAt: string): string => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const minutes = Math.floor(remaining / 60000);
    if (minutes < 1) return 'Expiring soon';
    if (minutes < 60) return `${minutes}m remaining`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg backdrop-blur-lg backdrop-filter bg-opacity-90"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Arbitrage Opportunities
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSortBy('profit')}
            className={`px-3 py-1 rounded-md ${
              sortBy === 'profit'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Profit
          </button>
          <button
            onClick={() => setSortBy('time')}
            className={`px-3 py-1 rounded-md ${
              sortBy === 'time'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Time
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {sortedOpportunities.map((opportunity) => (
            <motion.div
              key={opportunity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => onSelect?.(opportunity)}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">
                    {opportunity.player.name} - {opportunity.propType}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {opportunity.sport}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(opportunity.potentialProfit)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getTimeRemaining(opportunity.expiresAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                {opportunity.books.map((book: Book) => (
                  <div
                    key={book.name}
                    className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm"
                  >
                    <p className="text-sm font-medium">{book.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {book.line}
                      </span>
                      <span className="font-semibold">
                        {book.odds > 0 ? '+' : ''}{book.odds}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ArbitrageOpportunities; 