// betaTest4/src/utils/formatters.ts

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
};

export const formatOdds = (odds: number): string => {
  return odds.toFixed(2);
};

export const formatStake = (amount: number): string => {
  return formatCurrency(amount);
};

export const formatPotentialProfit = (stake: number, odds: number): string => {
  return formatCurrency(stake * odds - stake);
};

export const formatBankroll = (amount: number): string => {
  return formatCurrency(amount);
};

export const formatTransactionAmount = (amount: number, type: 'deposit' | 'withdrawal'): string => {
  const sign = type === 'deposit' ? '+' : '-';
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}; 