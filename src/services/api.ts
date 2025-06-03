import axios from 'axios'
import { unifiedMonitor } from '../core/UnifiedMonitor'
import { Sport } from './sportsAnalytics'
import { User, Bet, Analytics, Transaction, ArbitrageOpportunity, Event } from '../types/index'
import { BetPlacementResponse } from '../../shared/betting'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// API Keys
const ODDS_API_KEY = process.env.VITE_ODDS_API_KEY
const SPORTS_API_KEY = process.env.VITE_SPORTS_API_KEY

const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4'
const SPORTS_API_BASE_URL = 'https://api.sportsdata.io/v3'

const oddsApiClient = axios.create({
  baseURL: ODDS_API_BASE_URL,
  params: {
    apiKey: ODDS_API_KEY,
  },
})

const sportsApiClient = axios.create({
  baseURL: SPORTS_API_BASE_URL,
  params: {
    key: SPORTS_API_KEY,
  },
})

export interface OddsResponse {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: {
    key: string
    title: string
    markets: {
      key: string
      outcomes: {
        name: string
        price: number
      }[]
    }[]
  }[]
}

export interface PlayerStats {
  playerId: string
  name: string
  team: string
  position: string
  lastGames: {
    date: string
    stats: Record<string, number>
  }[]
  seasonAverages: Record<string, number>
  matchupStats: {
    opponent: string
    stats: Record<string, number>
  }[]
  injuryStatus?: string
  restDays: number
}

export interface TeamStats {
  teamId: string
  name: string
  league: Sport
  lastGames: {
    date: string
    opponent: string
    score: string
    stats: Record<string, number>
  }[]
  seasonStats: Record<string, number>
  homeAwaySplit: {
    home: Record<string, number>
    away: Record<string, number>
  }
  pace: number
  defensiveRating: number
  offensiveRating: number
}

export interface GameStats {
  date: string
  stats: Record<string, number>
}

class ApiService {
  private static instance: ApiService

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    throw new Error('getCurrentUser not implemented. Use your actual API logic here.')
  }

  async updateUser(data: Partial<User>): Promise<User> {
    throw new Error('updateUser not implemented. Use your actual API logic here.')
  }

  // Bet endpoints
  async getBets(): Promise<Bet[]> {
    throw new Error('getBets not implemented. Use your actual API logic here.')
  }

  async createBet(data: Omit<Bet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Bet> {
    throw new Error('createBet not implemented. Use your actual API logic here.')
  }

  async updateBet(id: string, data: Partial<Bet>): Promise<Bet> {
    throw new Error('updateBet not implemented. Use your actual API logic here.')
  }

  // Event endpoints
  async getEvents(): Promise<Event[]> {
    throw new Error('getEvents not implemented. Use your actual API logic here.')
  }

  async getEvent(id: string): Promise<Event> {
    throw new Error('getEvent not implemented. Use your actual API logic here.')
  }

  // Analytics endpoints
  async getAnalytics(): Promise<Analytics> {
    throw new Error('getAnalytics not implemented. Use your actual API logic here.')
  }

  // Transaction endpoints
  async getTransactions(): Promise<Transaction[]> {
    throw new Error('getTransactions not implemented. Use your actual API logic here.')
  }

  async createTransaction(data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>): Promise<Transaction> {
    throw new Error('createTransaction not implemented. Use your actual API logic here.')
  }

  // Arbitrage endpoints
  async getArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
    throw new Error('getArbitrageOpportunities not implemented. Use your actual API logic here.')
  }

  // API Keys getters
  getOddsApiKey(): string | undefined {
    return ODDS_API_KEY
  }

  getSportsDataApiKey(): string | undefined {
    return SPORTS_API_KEY
  }

  async getOdds(sport: Sport): Promise<OddsResponse[]> {
    try {
      const response = await oddsApiClient.get(`/sports/${sport}/odds`, {
        params: {
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american',
        },
      })
      unifiedMonitor.recordMetric('api.odds.success', 1, { sport })
      return response.data
    } catch (error) {
      unifiedMonitor.recordMetric('api.odds.error', 1, { sport })
      throw error
    }
  }

  async getPlayerStats(sport: Sport, playerId: string): Promise<PlayerStats> {
    try {
      const response = await sportsApiClient.get(`/${sport}/stats/json/Player/${playerId}`)
      unifiedMonitor.recordMetric('api.player.success', 1, { sport, playerId })
      return response.data
    } catch (error) {
      unifiedMonitor.recordMetric('api.player.error', 1, { sport, playerId })
      throw error
    }
  }

  async getTeamStats(sport: Sport, teamId: string): Promise<TeamStats> {
    try {
      const response = await sportsApiClient.get(`/${sport}/stats/json/Team/${teamId}`)
      unifiedMonitor.recordMetric('api.team.success', 1, { sport, teamId })
      return response.data
    } catch (error) {
      unifiedMonitor.recordMetric('api.team.error', 1, { sport, teamId })
      throw error
    }
  }

  async getPlayerGameStats(sport: Sport, playerId: string): Promise<GameStats[]> {
    try {
      const response = await sportsApiClient.get(`/${sport}/stats/json/PlayerGameStatsByPlayer/${playerId}`)
      unifiedMonitor.recordMetric('api.playerGames.success', 1, { sport, playerId })
      return response.data.map((game: any) => ({
        date: game.date,
        stats: {
          points: game.points,
          rebounds: game.rebounds,
          assists: game.assists,
          steals: game.steals,
          blocks: game.blocks,
          threePointersMade: game.threePointersMade,
          minutes: game.minutes,
          line: game.line,
        },
      }))
    } catch (error) {
      unifiedMonitor.recordMetric('api.playerGames.error', 1, { sport, playerId })
      throw error
    }
  }

  async placeBet(bet: any): Promise<BetPlacementResponse> {
    try {
      const response = await oddsApiClient.post('/bets', bet)
      unifiedMonitor.recordMetric('api.bet.success', 1, { betId: bet.id })
      return {
        betId: bet.id,
        success: true,
        message: 'Bet placed successfully',
        transactionId: response.data.transactionId,
      }
    } catch (error) {
      unifiedMonitor.recordMetric('api.bet.error', 1, { betId: bet.id })
      return {
        betId: bet.id,
        success: false,
        message: 'Failed to place bet',
      }
    }
  }
}

// Create and export a single instance
const apiService = ApiService.getInstance()
export { apiService }
