import React, { useMemo, useState } from 'react';
import {
import { ArbitrageOpportunity } from '../types';
import { FaChartLine, FaCalculator, FaExchangeAlt } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { calculateKellyCriterion, americanToDecimal } from '../utils/odds';
import { motion } from 'framer-motion';
import { useApiRequest } from '../hooks/useApiRequest';

  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics: React.FC = () => {
  // Fetch user performance data
  const { data: perf, isLoading: perfLoading, error: perfError } = useApiRequest<any>('/api/user/performance');
  // Fetch arbitrage opportunities
  const { data: arbs, isLoading: arbsLoading, error: arbsError } = useApiRequest<ArbitrageOpportunity[]>('/api/arbitrage/opportunities');

  // Kelly Criterion calculator state
  const [kellyBankroll, setKellyBankroll] = useState(1000);
  const [kellyProb, setKellyProb] = useState(0.55);
  const [kellyOdds, setKellyOdds] = useState(-110);
  const [kellyFraction, setKellyFraction] = useState(1);

  // Prepare Chart.js data for recentHistory
  const chartData = useMemo(() => {
    if (!perf?.recentHistory) return { labels: [], datasets: [] };
    return {
      labels: perf.recentHistory.labels,
      datasets: perf.recentHistory.datasets.map((ds: any) => ({
        ...ds,
        fill: true,
        tension: 0.4,
        borderColor: ds.borderColor || 'rgb(16, 185, 129)',
        backgroundColor: ds.backgroundColor || 'rgba(16, 185, 129, 0.1)',
      })),
    };
  }, [perf]);

  // Kelly calculation
  const kellyStake = useMemo(() => {
    const decOdds = americanToDecimal(Number(kellyOdds));
    return calculateKellyCriterion(Number(kellyProb), decOdds, Number(kellyBankroll), Number(kellyFraction));
  }, [kellyBankroll, kellyProb, kellyOdds, kellyFraction]);

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaChartLine className="w-5 h-5 mr-2 text-primary-500" />
          My Performance
        </h3>
        {perfLoading ? (
          <div className="text-gray-500 animate-pulse-soft">Loading performance...</div>
        ) : perfError ? (
          <div className="text-red-500">{perfError.message}</div>
        ) : perf ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Total Bets</div>
              <div className="text-2xl font-bold">{perf.totalBets}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Win Rate</div>
              <div className="text-2xl font-bold text-green-600">{(perf.winRate * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Profit</div>
              <div className="text-2xl font-bold text-blue-600">${perf.profit.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">ROI</div>
              <div className="text-2xl font-bold text-purple-600">{(perf.roi * 100).toFixed(1)}%</div>
            </div>
          </div>
        ) : null}
        {/* Recent History Chart */}
        <div className="h-64">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 800 },
              plugins: { legend: { display: false } },
              scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(156,163,175,0.1)' } },
                x: { grid: { display: false } }
              }
            }}
          />
        </div>
      </motion.div>

      {/* Kelly Criterion Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-morphism p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaCalculator className="w-5 h-5 mr-2 text-primary-500" />
          Kelly Criterion Calculator
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Bankroll</label>
            <input type="number" className="premium-input w-full" value={kellyBankroll} min={1} onChange={e => setKellyBankroll(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Win Probability</label>
            <input type="number" className="premium-input w-full" value={kellyProb} min={0} max={1} step={0.01} onChange={e => setKellyProb(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Odds (American)</label>
            <input type="number" className="premium-input w-full" value={kellyOdds} onChange={e => setKellyOdds(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fraction</label>
            <input type="number" className="premium-input w-full" value={kellyFraction} min={0.01} max={1} step={0.01} onChange={e => setKellyFraction(Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-2 text-lg font-bold text-green-600">
          Optimal Bet: ${kellyStake.toFixed(2)}
        </div>
      </motion.div>

      {/* Arbitrage Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-morphism p-6 rounded-xl"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FaExchangeAlt className="w-5 h-5 mr-2 text-primary-500" />
          Arbitrage Opportunities
        </h3>
        {arbsLoading ? (
          <div className="text-gray-500 animate-pulse-soft">Loading opportunities...</div>
        ) : arbsError ? (
          <div className="text-red-500">{arbsError.message}</div>
        ) : arbs && arbs.length > 0 ? (
          <div className="space-y-4">
            {arbs.map(opp => (
              <div key={opp.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{opp.player.name}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{opp.player.team.abbreviation}</span>
                      <span className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">{opp.propType}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      {opp.books.map(book => (
                        <div key={book.name} className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">{book.name}:</span>
                          <span className="ml-1 font-medium">{book.line} @ {book.odds > 0 ? '+' : ''}{book.odds}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Potential Profit</span>
                      <span className="text-lg font-bold text-green-500">${opp.potentialProfit.toFixed(2)}</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">Expires: {new Date(opp.expiresAt).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No arbitrage opportunities found.</div>
        )}
      </motion.div>
    </div>
  );
};

export default Analytics; 