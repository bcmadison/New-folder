import React, { useEffect, useState } from 'react';
import useStore from '@/store/useStore';
import { PerformanceMetrics, BetRecord, Player, MLInsight } from '@/types/core';
import { UnifiedBettingSystem } from '@/core/UnifiedBettingSystem';
import { useAppState } from './StateProvider';

// import { Line } from 'react-chartjs-2'; // Comment out for now
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// } from 'chart.js'; // Comment out for now
// import { useAnalytics } from '../../hooks/useAnalytics'; // Placeholder - will create later
// import { useMoneyMaker } from '../../hooks/useMoneyMaker'; // Placeholder - will create later

// Register Chart.js components - Comment out for now
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// );

// Placeholder components until they are created
const PropCards: React.FC = () => <div className="p-4 mb-6 bg-gray-800 rounded-xl shadow-xl glassmorphic text-center"><h2 className="text-xl font-semibold text-gray-100">Prop Cards Area</h2><p className="text-gray-400">Dynamic prop cards will be displayed here.</p></div>;
const EntryTracking: React.FC = () => <div className="p-4 mb-6 bg-gray-800 rounded-xl shadow-xl glassmorphic text-center"><h2 className="text-xl font-semibold text-gray-100">Entry Tracking Area</h2><p className="text-gray-400">Real-time entry progress will be shown here.</p></div>;
const ESPNHeadlinesTicker: React.FC = () => <div className="p-4 mb-6 bg-gray-800 rounded-xl shadow-xl glassmorphic text-center"><h2 className="text-xl font-semibold text-gray-100">ESPN Headlines</h2><p className="text-gray-400">Live news ticker will be displayed here.</p></div>;
const MoneyMaker: React.FC = () => <div className="p-4 mb-6 bg-gray-800 rounded-xl shadow-xl glassmorphic text-center"><h2 className="text-xl font-semibold text-gray-100">Money Maker Engine</h2><p className="text-gray-400">Optimal parlay suggestions will appear here.</p></div>;

const Dashboard: React.FC = () => {
  const { metrics, user, bets } = useStore();
  // const { overallPerformance, trendingPlayers, mlInsights } = useAnalytics(); // Placeholder
  // const { moneyMakerResults, runMoneyMaker } = useMoneyMaker(); // Placeholder

  // Placeholder data until hooks and actual data sources are implemented
  const overallPerformanceData: PerformanceMetrics | null = metrics ? metrics : {
    totalBets: 150,
    winRate: 62.5,
    profitLoss: 1250.75,
    roi: 15.2,
    clvAverage: 25.50,
    edgeRetention: 85,
    kellyMultiplier: 0.25,
    marketEfficiencyScore: 78,
    averageOdds: 1.95,
    maxDrawdown: 15,
    sharpeRatio: 1.2,
    betterThanExpected: 5,
  };

  const trendingPlayersData: Player[] = [
    {
      id: '1',
      name: 'LeBron James',
      team: 'Lakers',
      position: 'SF',
      opponent: 'Clippers',
      gameTime: 'Tomorrow 8:00 PM',
      sport: 'Basketball',
      winningProp: {
        stat: 'Points',
        line: 28.5,
        type: 'OVER',
        percentage: 75,
      },
      whyThisBet: 'Consistent scorer, good matchup.'
    },
    {
      id: '2',
      name: 'Kevin Durant',
      team: 'Suns',
      position: 'SF',
      opponent: 'Nuggets',
      gameTime: 'Today 10:00 PM',
      sport: 'Basketball',
      winningProp: {
        stat: 'Points + Rebounds + Assists',
        line: 45.5,
        type: 'OVER',
        percentage: 68,
      },
      whyThisBet: 'High usage rate, expected to play big minutes.'
    },
  ];

  const mlInsightsData: MLInsight[] = [
    { factor: 'Team Fatigue', impact: -0.05, confidence: 0.7, description: 'Team playing back-to-back games, potential for lower performance.' },
    { factor: 'Opponent Defensive Rating', impact: -0.1, confidence: 0.85, description: 'Facing a team with a top 5 defensive rating, points may be harder to come by.' },
    { factor: 'Recent Player Form (Last 5 Games)', impact: 0.08, confidence: 0.78, description: 'Player has exceeded this line in 4 of the last 5 games.' },
  ];


  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-gray-900 text-white min-h-screen">
        <h2 className="text-2xl font-semibold text-gray-300">Welcome to the AI Sports Betting Analytics Platform!</h2>
        <p className="mt-2 text-gray-400">Please log in or register to access your dashboard and start analyzing bets.</p>
        {/* TODO: Add login/register buttons or redirect here */}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-gray-900 text-white min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-400 mt-1 text-sm sm:text-base">Here's your AI-powered betting overview.</p>
      </header>

      {/* Overall Performance Section */}
      {overallPerformanceData && (
        <section className="p-4 sm:p-6 bg-gray-800 rounded-xl shadow-xl glassmorphic mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Overall Performance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-gray-700 rounded-lg shadow-md">
              <p className="text-sm text-purple-400">Win Rate</p>
              <p className="text-lg sm:text-xl font-bold text-white">{overallPerformanceData.winRate.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg shadow-md">
              <p className="text-sm text-purple-400">P&L</p>
              <p className="text-lg sm:text-xl font-bold text-green-400">${overallPerformanceData.profitLoss.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg shadow-md">
              <p className="text-sm text-purple-400">ROI</p>
              <p className="text-lg sm:text-xl font-bold text-white">{overallPerformanceData.roi.toFixed(1)}%</p>
            </div>
            <div className="p-3 bg-gray-700 rounded-lg shadow-md">
              <p className="text-sm text-purple-400">Total Bets</p>
              <p className="text-lg sm:text-xl font-bold text-white">{overallPerformanceData.totalBets}</p>
            </div>
          </div>
        </section>
      )}

      {/* ESPN Headlines Ticker */}
      <ESPNHeadlinesTicker />

      {/* Money Maker Section */}
      <MoneyMaker />

      {/* Prop Cards Section */}
      <PropCards />

      {/* Entry Tracking Section */}
      <EntryTracking />

      {/* Trending Players & ML Insights (Combined for now) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-4 sm:p-6 bg-gray-800 rounded-xl shadow-xl glassmorphic">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">🔥 Trending Players</h2>
          <ul className="space-y-3">
            {trendingPlayersData.map(player => (
              <li key={player.id} className="p-3 bg-gray-700 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                    <p className="font-medium text-white">{player.name} ({player.team})</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${player.winningProp && player.winningProp.percentage > 70 ? 'bg-green-500 text-green-900' : player.winningProp && player.winningProp.percentage > 60 ? 'bg-yellow-500 text-yellow-900' : 'bg-red-500 text-red-900'}`}>
                        {player.winningProp ? `${player.winningProp.percentage}% ML Edge` : 'N/A'}
                    </span>
                </div>
                {player.winningProp && (
                    <p className="text-sm text-purple-300 mt-1">
                        {player.winningProp.stat} {player.winningProp.line} ({player.winningProp.type})
                    </p>
                )}
                {player.whyThisBet && <p className="text-xs text-gray-400 mt-1">{player.whyThisBet}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 sm:p-6 bg-gray-800 rounded-xl shadow-xl glassmorphic">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">🤖 ML Insights</h2>
          <ul className="space-y-3">
            {mlInsightsData.map(insight => (
              <li key={insight.factor} className="p-3 bg-gray-700 rounded-lg shadow-md">
                <p className="font-medium text-white">
                  {insight.factor}: 
                  <span className={insight.impact >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {insight.impact >= 0 ? '+' : ''}{(insight.impact * 100).toFixed(1)}%
                  </span> 
                  (Conf: {(insight.confidence * 100).toFixed(0)}%)
                </p>
                <p className="text-xs text-gray-400 mt-1">{insight.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Placeholder for Chart.js analytics graphs */}
      <section className="p-4 sm:p-6 bg-gray-800 rounded-xl shadow-xl glassmorphic mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Performance Analytics (Charts)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gray-700 rounded-lg text-center h-64 flex items-center justify-center">Chart.js - User Performance History Placeholder</div>
            <div className="p-4 bg-gray-700 rounded-lg text-center h-64 flex items-center justify-center">Chart.js - Kelly Criterion Analysis Placeholder</div>
        </div>
      </section>

       {/* Placeholder for Arbitrage Scanner */}
      <section className="p-4 sm:p-6 bg-gray-800 rounded-xl shadow-xl glassmorphic">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-100">Arbitrage Scanner</h2>
        <div className="p-4 bg-gray-700 rounded-lg text-center h-40 flex items-center justify-center">Arbitrage Opportunities Placeholder</div>
      </section>

    </div>
  );
};

export default Dashboard;

// Comment out existing Chart.js related code to avoid conflicts for now
/*
// ... existing code ...
// import PropCards from './PropCards'; // Already defined as placeholder
// import EntryTracking from './EntryTracking'; // Already defined as placeholder
// import ESPNHeadlinesTicker from './ESPNHeadlinesTicker'; // Already defined as placeholder
// import MoneyMaker from './MoneyMaker'; // Already defined as placeholder

// ... existing code ...
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
  }[];
}

// const Dashboard: React.FC = () => { // This is a re-declaration, ensure it's handled
//   const { metrics, setMetrics, user } = useStore(); // metrics and user already destructured
//   const [profitChartData, setProfitChartData] = useState<ChartData | null>(null);
//   const [winRateChartData, setWinRateChartData] = useState<ChartData | null>(null);
//   const bettingSystem = UnifiedBettingSystem.getInstance();
//   const bets = useStore(state => state.bets); // bets already destructured

//   // Replace destructuring with safe access and type assertions
//   const appState = useAppState() || {} as any;
//   const props = appState.props || [];
//   const entries = appState.entries || [];
//   const espnHeadlines = appState.espnHeadlines || [];
//   const sentiment = appState.sentiment || {};

//   // Calculate stats
//   const totalBets = entries.length;
//   const wins = entries.filter(e => e.status === 'won').length;
//   const winRate = totalBets > 0 ? (wins / totalBets * 100) : 0;
//   const totalProfit = entries.reduce((sum, e) => sum + (e.status === 'won' ? e.potentialPayout - e.entry : -e.entry), 0);
//   const roi = totalBets > 0 ? (totalProfit / entries.reduce((sum, e) => sum + e.entry, 0)) * 100 : 0;
//   // Guard Object.entries with nullish coalescing
//   const trendingPlayers = Object.entries(sentiment ?? {})
//     .filter(([_, s]) => Math.abs((s as any)?.sentiment?.score ?? 0) > 0.5)
//     .sort((a, b) => Math.abs((b[1] as any)?.sentiment?.score ?? 0) - Math.abs((a[1] as any)?.sentiment?.score ?? 0))
//     .slice(0, 3);

//   useEffect(() => {
//     if (bets && bets.length > 0) { // Added null check for bets
//       const currentMetrics = bettingSystem.calculatePerformanceMetrics(bets);
//       if(setMetrics) setMetrics(currentMetrics);
//       updateCharts(bets);
//     }
//   }, [bets, bettingSystem, setMetrics]); // Added bettingSystem and setMetrics to dependency array

//   const updateCharts = (currentBets: BetRecord[]) => {
//     const sortedBets = [...currentBets].sort((a, b) => a.timestamp - b.timestamp);
//     const labels = sortedBets.map(bet => new Date(bet.timestamp).toLocaleDateString());
    
//     let runningProfit = 0;
//     const profitData = sortedBets.map(bet => {
//       // Ensure payout and stake exist and are numbers, and result is valid
//       const stake = typeof bet.stake === 'number' ? bet.stake : 0;
//       let profitChange = 0;
//       if (bet.result === 'WIN') {
//         const payout = typeof (bet as any).payout === 'number' ? (bet as any).payout : stake; // Temporary fix for payout
//         profitChange = payout - stake;
//       } else if (bet.result === 'LOSS') {
//         profitChange = -stake;
//       }
//       runningProfit += profitChange;
//       return runningProfit;
//     });

//     setProfitChartData({
//       labels,
//       datasets: [{
//         label: 'Cumulative Profit',
//         data: profitData,
//         borderColor: 'rgb(75, 192, 192)',
//         backgroundColor: 'rgba(75, 192, 192, 0.2)',
//         fill: true
//       }]
//     });

//     const windowSize = 10;
//     const winRates = sortedBets.map((bet, index) => {
//       const window = sortedBets.slice(Math.max(0, index - windowSize + 1), index + 1);
//       const winsInWindow = window.filter(b => b.result === 'WIN').length; // Renamed to avoid conflict
//       return (winsInWindow / window.length) * 100;
//     });

//     setWinRateChartData({
//       labels,
//       datasets: [{
//         label: 'Win Rate (%)',
//         data: winRates,
//         borderColor: 'rgb(153, 102, 255)',
//         backgroundColor: 'rgba(153, 102, 255, 0.2)',
//         fill: true
//       }]
//     });
//   };

//   const chartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'top' as const,
//       },
//       title: {
//         display: true,
//         text: 'Performance Metrics',
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//       },
//     },
//   };

//   // The existing return statement and conditional rendering for !user are part of the new structure.
//   // The old structure for rendering the dashboard sections is replaced by the new structure above.
// }; // This closing brace is part of the old Dashboard re-declaration
*/

</rewritten_file> 