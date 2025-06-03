import { PrizePicksEntry } from '../../../shared/prizePicks'; // Use shared type

export interface UserStatsData {
  totalBets: number; // All bets placed by user (including pending/active)
  settledBets: number; // Bets that are won or lost
  winRate: number; // Based on settled bets
  totalProfitLoss: number; // Based on settled bets
  roi: number; // Based on settled bets
  // Add other relevant stats as needed
}

export interface PerformanceChartData {
  labels: string[]; // e.g., dates or bet numbers (from settled bets)
  profitData: number[]; // cumulative profit/loss over time (from settled bets)
  // Add other datasets if needed (e.g., ROI over time)
}

/**
 * Calculates user statistics based on their betting entries.
 */
export const calculateUserStats = (entries: PrizePicksEntry[], userId?: string): UserStatsData => {
  if (!userId) {
    return { totalBets: 0, settledBets: 0, winRate: 0, totalProfitLoss: 0, roi: 0 };
  }

  const userEntries = (Array.isArray(entries) ? entries : []).filter(entry => entry.user_id === userId);
  const totalBets = userEntries.length;

  const settledEntries = userEntries.filter(entry => entry.status === 'won' || entry.status === 'lost');
  const settledBetsCount = settledEntries.length;

  let wins = 0;
  let totalStakeOnSettled = 0;
  let totalGrossReturnFromWon = 0;

  settledEntries.forEach(entry => {
    totalStakeOnSettled += entry.stake;
    if (entry.status === 'won') {
      wins++;
      totalGrossReturnFromWon += entry.payout;
    }
  });

  const winRate = settledBetsCount > 0 ? (wins / settledBetsCount) * 100 : 0;
  const totalProfitLoss = totalGrossReturnFromWon - totalStakeOnSettled;
  const roi = totalStakeOnSettled > 0 ? (totalProfitLoss / totalStakeOnSettled) * 100 : 0;

  console.log("[calculateUserStats] Processed entries. Total Bets:", totalBets, "Settled:", settledBetsCount, "Wins:", wins, "P/L:", totalProfitLoss, "ROI:", roi);

  return {
    totalBets,
    settledBets: settledBetsCount,
    winRate,
    totalProfitLoss,
    roi,
  };
};

/**
 * Aggregates entry data for performance charting, focusing on settled bets.
 */
export const aggregatePerformanceData = (entries: PrizePicksEntry[]): PerformanceChartData => {
  const settledEntries = (Array.isArray(entries) ? entries : []).filter(entry => entry.status === 'won' || entry.status === 'lost');
  if (settledEntries.length === 0) {
    return { labels: [], profitData: [] };
  }
  const sortedSettledEntries = [...settledEntries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const labels: string[] = [];
  const profitData: number[] = [];
  let cumulativeProfit = 0;
  sortedSettledEntries.forEach((entry, index) => {
    labels.push(`Bet ${index + 1} (${new Date(entry.created_at).toLocaleDateString()})`);
    if (entry.status === 'won') {
      cumulativeProfit += (entry.payout - entry.stake);
    } else if (entry.status === 'lost') {
      cumulativeProfit -= entry.stake;
    }
    profitData.push(cumulativeProfit);
  });
  console.log("[aggregatePerformanceData] Processed settled entries for chart. Count:", sortedSettledEntries.length);
  return {
    labels,
    profitData,
  };
}; 