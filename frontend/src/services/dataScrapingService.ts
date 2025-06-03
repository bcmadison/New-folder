import { AxiosResponse } from 'axios';
import { PrizePicksPlayer } from '../types/prizePicks';
import { cached } from '../utils/cacheUtils';
import { createAxiosWithRetry } from '../utils/apiUtils';


interface DailyFantasyProjection {
  name: string;
  team: string;
  position: string;
  opp_team: string;
  game_date: string;
  is_home: boolean;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  three_pt: number;
  min: number;
}

interface DailyFantasyResponse {
  projections: DailyFantasyProjection[];
}

interface StatisticsResponse {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  threes: number;
  minutes: number;
}

interface PlayerData {
  name: string;
  team: string;
  position: string;
  opponent: string;
  gameTime: string;
  stats: StatisticsResponse;
}

export class DataScrapingService {
  private static instance: DataScrapingService;
  private readonly dailyFantasyApi;
  private readonly RATE_LIMIT_DELAY = 1000;
  private lastApiCall: number;
  private readonly API_KEY: string;
  
  private constructor() {
    this.lastApiCall = 0;
    this.API_KEY = import.meta.env.VITE_DAILY_FANTASY_API_KEY;
    
    if (!this.API_KEY) {
      throw new Error('Daily Fantasy API key not found in environment variables');
    }

    this.dailyFantasyApi = createAxiosWithRetry('https://api.dailyfantasyapi.com/api/v1', {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000
    });
  }

  static getInstance(): DataScrapingService {
    if (!DataScrapingService.instance) {
      DataScrapingService.instance = new DataScrapingService();
    }
    return DataScrapingService.instance;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    if (timeSinceLastCall < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastCall));
    }
    this.lastApiCall = Date.now();
  }

  // Manual cache for 5 minutes
  private _playerDataCache: { data: PrizePicksPlayer[]; timestamp: number } | null = null;
  public async fetchPlayerData(): Promise<PrizePicksPlayer[]> {
    const now = Date.now();
    if (this._playerDataCache && (now - this._playerDataCache.timestamp < 300000)) {
      return this._playerDataCache.data;
    }
    try {
      await this.rateLimit();
      const { data } = await (this.dailyFantasyApi.get('/nba/projections', {
        params: {
          apikey: this.API_KEY
        }
      }) as any);

      if (!data || !data.projections) {
        console.error('Invalid response from Daily Fantasy API');
        return [];
      }

      const result = this.transformToProps(data.projections);
      this._playerDataCache = { data: result, timestamp: now };
      return result;
    } catch (error) {
      console.error('Error fetching player data:', error);
      return [];
    }
  }

  private getDefaultStats(): StatisticsResponse {
    return {
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      threes: 0,
      minutes: 0
    };
  }

  private transformToProps(projections: DailyFantasyProjection[]): PrizePicksPlayer[] {
    return projections.map(proj => {
      const gameTime = new Date(proj.game_date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      });

      const stats: StatisticsResponse = {
        points: proj.pts || 0,
        rebounds: proj.reb || 0,
        assists: proj.ast || 0,
        steals: proj.stl || 0,
        blocks: proj.blk || 0,
        threes: proj.three_pt || 0,
        minutes: proj.min || 0
      };

      const isHome = proj.is_home;
      const opponent = `${isHome ? 'vs' : '@'} ${proj.opp_team}`;

      const statTypes = ['Points', 'Rebounds', 'Assists', 'Threes', 'Steals', 'Blocks'];
      const statType = statTypes[Math.floor(Math.random() * statTypes.length)];
      const statValue = stats[statType.toLowerCase() as keyof StatisticsResponse];

      return {
        player_name: proj.name,
        team_abbreviation: proj.team,
        position: proj.position || 'N/A',
        opponent_team: proj.opp_team,
        sport: 'NBA',
        game_time: gameTime,
        pick_count: `${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 9)}K`,
        stat_type: statType,
        line_value: Math.round(statValue * 0.8 * 2) / 2,
        projected_value: statValue,
        confidence_percentage: Math.random() * 0.3 + 0.5,
        player_image_url: this.getPlayerImageUrl(proj.name),
        goblin_icon_url: '/assets/goblin.svg',
        demon_icon_url: '/assets/demon.svg',
        normal_icon_url: '/assets/normal.svg'
      };
    });
  }

  private getPlayerImageUrl(playerName: string): string {
    // Convert player name to format used in NBA's image CDN
    const formattedName = playerName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/\./g, '')
      .replace(/'/g, '');
    
    return `https://ak-static.cms.nba.com/wp-content/uploads/headshots/nba/latest/260x190/${formattedName}.png`;
  }
} 