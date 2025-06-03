
export interface PrizePicksPlayer {
  id: string;
  name: string;
  team: string;
  position?: string;
}

export interface PrizePicksProjection {
  id: string;
  playerId: string;
  player?: PrizePicksPlayer; // Optional, if API provides full player data with projection
  statType: string; // e.g., 'points', 'rebounds', 'fantasy_score'
  line: number;
  // Odds for over/under are usually not directly provided by PrizePicks for their main format,
  // as it's a fixed payout system. But if there are contexts where odds appear, add them.
  // overOdds?: number;
  // underOdds?: number;
  // Additional metadata
  description?: string;
  gameId?: string;
  startTime?: string; // ISO string
  opponent?: string;
  // Any other relevant fields from the API
  [key: string]: any; 
}

export interface PrizePicksLeague {
  id: string;
  name: string;
  sport: string; // e.g., 'NBA', 'NFL'
}

// Overall structure of data you might get from a PrizePicks API endpoint
export interface PrizePicksData {
  projections: PrizePicksProjection[];
  players?: PrizePicksPlayer[]; // Optional, if a separate endpoint or included
  leagues?: PrizePicksLeague[]; // Optional
  lastUpdated: string; // ISO string for when this data was fetched/generated
}

export interface PropOption {
  line: number;
  type: 'goblin' | 'normal' | 'demon';
  icon: string;
  percentage: number;
  multiplier: number;
}

export interface DetailedProp {
  stat: string;
  projectedValue: number;
  options: PropOption[];
}

export interface ProcessedPrizePicksProp extends PrizePicksPlayer {
  detailedProps: DetailedProp[];
  winningProp: PropOption;
}

export interface PropCardStyles {
  backgroundColor: string;
  borderColor: string;
  glowIntensity: number;
}

export interface FilterOptions {
  type: 'all' | 'high-confidence' | 'trending' | 'goblins' | 'demons' | 'value-bets';
  threshold: number;
}

export const PRIZEPICKS_CONFIG = {
  UPDATE_INTERVAL: 60000, // 60 seconds
  BATCH_SIZE: 50,
  MAX_RETRY_ATTEMPTS: 3,
  CACHE_DURATION: 300000, // 5 minutes
  GOBLIN_CONFIDENCE_THRESHOLD: 0.65,
  DEMON_RISK_THRESHOLD: 0.4,
  VALUE_BET_THRESHOLD: 3,
  HIGH_CONFIDENCE_THRESHOLD: 0.7,
  TRENDING_THRESHOLD: 100, // Minimum pick count to be considered trending
  PROCESSING_CHUNK_SIZE: 20,
  FILTER_DEBOUNCE_MS: 300
} as const; 