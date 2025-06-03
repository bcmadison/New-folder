// betaTest4/src/utils/constants.ts

export const APP_NAME = 'Betting Analyzer';
export const DEFAULT_THEME = 'dark';
export const MAX_PARLAY_LEGS = 6;

// API related constants could go here if not in .env or service configs
// export const API_TIMEOUT = 15000; // ms

// Other app-wide constants 

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ANALYTICS: '/analytics',
  ARBITRAGE: '/arbitrage',
  BETS: '/bets',
  BANKROLL: '/bankroll',
  SETTINGS: '/settings',
} as const;

export const BET_TYPES = {
  WIN: 'win',
  LOSE: 'lose',
  DRAW: 'draw',
} as const;

export const BET_STATUS = {
  PENDING: 'pending',
  WON: 'won',
  LOST: 'lost',
} as const;

export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  FINISHED: 'finished',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
} as const;

export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 10,
  INITIAL_PAGE: 1,
} as const;

export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  REGISTRATION_FAILED: 'Failed to create account. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
} as const;

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  REGISTRATION_SUCCESS: 'Account created successfully',
  LOGOUT_SUCCESS: 'Successfully logged out',
  BET_PLACED: 'Bet placed successfully',
  TRANSACTION_COMPLETED: 'Transaction completed successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
} as const; 