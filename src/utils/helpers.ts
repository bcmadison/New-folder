// betaTest4/src/utils/helpers.ts

import { Bet, Event, Transaction } from '@/types';

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

export const isValidUsername = (username: string): boolean => {
  return username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
};

export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000;
};

export const isValidOdds = (odds: number): boolean => {
  return odds >= 1.01 && odds <= 1000;
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

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
// Add other generic helper functions as needed 