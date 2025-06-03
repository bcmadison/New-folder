import { Bet, Event, Transaction } from '@/types';

export * from './constants';
export * from './formatters';
export * from './helpers';
// export * from './logger'; // If a logger util is created
// export * from './localStorage'; // If localStorage helpers are created 

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateProfitLoss = (bet: Bet): number => {
  if (bet.status === 'pending') return 0;
  return bet.status === 'won' ? bet.amount * bet.odds - bet.amount : -bet.amount;
};

export const calculateTotalProfitLoss = (bets: Bet[]): number => {
  return bets.reduce((total, bet) => total + calculateProfitLoss(bet), 0);
};

export const calculateWinRate = (bets: Bet[]): number => {
  const completedBets = bets.filter((bet) => bet.status !== 'pending');
  if (completedBets.length === 0) return 0;
  const wins = completedBets.filter((bet) => bet.status === 'won').length;
  return (wins / completedBets.length) * 100;
};

export const calculateROI = (bets: Bet[]): number => {
  const totalStake = bets.reduce((total, bet) => total + bet.amount, 0);
  if (totalStake === 0) return 0;
  return (calculateTotalProfitLoss(bets) / totalStake) * 100;
};

export const getEventStatus = (event: Event): string => {
  switch (event.status) {
    case 'upcoming':
      return 'Upcoming';
    case 'live':
      return 'Live';
    case 'finished':
      return 'Finished';
    default:
      return 'Unknown';
  }
};

export const getTransactionStatus = (transaction: Transaction): string => {
  switch (transaction.status) {
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
};

export const getBetStatus = (bet: Bet): string => {
  switch (bet.status) {
    case 'pending':
      return 'Pending';
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    default:
      return 'Unknown';
  }
};

export const calculateArbitrageProfit = (
  stake: number,
  odds: { home: number; draw: number; away: number }
): number => {
  const totalStake = stake;
  const potentialReturns = {
    home: stake * odds.home,
    draw: stake * odds.draw,
    away: stake * odds.away,
  };
  const minReturn = Math.min(...Object.values(potentialReturns));
  return minReturn - totalStake;
}; 