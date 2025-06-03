import { Sport } from './sportsAnalytics';
import { notificationService } from './notification';

interface LiveOdds {
  propId: string;
  value: number;
  overMultiplier: number;
  underMultiplier: number;
  timestamp: number;
  movement: {
    direction: 'up' | 'down' | 'stable';
    amount: number;
    timeFrame: number;
  };
}

interface InjuryUpdate {
  playerId: string;
  playerName: string;
  team: string;
  status: 'out' | 'questionable' | 'probable' | 'available';
  injury: string;
  timestamp: number;
  expectedReturn?: string;
}

interface LineMovement {
  propId: string;
  oldValue: number;
  newValue: number;
  direction: 'up' | 'down';
  timestamp: number;
  confidence: number;
}

interface BreakingNews {
  id: string;
  title: string;
  content: string;
  type: 'injury' | 'trade' | 'suspension' | 'other';
  timestamp: number;
  impact: 'high' | 'medium' | 'low';
  affectedProps?: string[];
}

class RealTimeUpdatesService {
  private static instance: RealTimeUpdatesService;
  private liveOdds: Map<string, LiveOdds> = new Map();
  private injuries: Map<string, InjuryUpdate> = new Map();
  private lineMovements: Map<string, LineMovement[]> = new Map();
  private breakingNews: Map<string, BreakingNews> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
  private cache: Map<string, any> = new Map();

  private constructor() {
    this.initializeWebSocket();
  }

  static getInstance(): RealTimeUpdatesService {
    if (!RealTimeUpdatesService.instance) {
      RealTimeUpdatesService.instance = new RealTimeUpdatesService();
    }
    return RealTimeUpdatesService.instance;
  }

  private initializeWebSocket(): void {
    // TODO: Implement WebSocket connection
    // This would connect to a real-time data provider
    // and handle incoming updates
  }

  // Live Odds
  async getLiveOdds(propId: string): Promise<LiveOdds | null> {
    const cacheKey = `odds_${propId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const odds = this.liveOdds.get(propId);
    if (odds) {
      this.setCache(cacheKey, odds);
    }
    return odds || null;
  }

  async updateLiveOdds(odds: LiveOdds): Promise<void> {
    this.liveOdds.set(odds.propId, odds);
    this.notifySubscribers('odds', odds);
    this.setCache(`odds_${odds.propId}`, odds);
  }

  // Injury Updates
  async getInjuryUpdate(playerId: string): Promise<InjuryUpdate | null> {
    return this.injuries.get(playerId) || null;
  }

  async updateInjuryStatus(update: InjuryUpdate): Promise<void> {
    this.injuries.set(update.playerId, update);
    this.notifySubscribers('injury', update);
    
    if (update.status === 'out' || update.status === 'questionable') {
      notificationService.notify(
        'warning',
        'Injury Update',
        `${update.playerName} (${update.team}) is ${update.status} - ${update.injury}`
      );
    }
  }

  // Line Movements
  async getLineMovements(propId: string): Promise<LineMovement[]> {
    return this.lineMovements.get(propId) || [];
  }

  async recordLineMovement(movement: LineMovement): Promise<void> {
    const movements = this.lineMovements.get(movement.propId) || [];
    movements.push(movement);
    this.lineMovements.set(movement.propId, movements);
    this.notifySubscribers('lineMovement', movement);

    if (Math.abs(movement.newValue - movement.oldValue) >= 0.5) {
      notificationService.notify(
        'info',
        'Line Movement',
        `Line moved ${movement.direction} from ${movement.oldValue} to ${movement.newValue}`
      );
    }
  }

  // Breaking News
  async getBreakingNews(): Promise<BreakingNews[]> {
    return Array.from(this.breakingNews.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async addBreakingNews(news: BreakingNews): Promise<void> {
    this.breakingNews.set(news.id, news);
    this.notifySubscribers('breakingNews', news);

    if (news.impact === 'high') {
      notificationService.notify(
        'error',
        'Breaking News',
        news.title
      );
    }
  }

  // Subscription System
  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);

    return () => {
      const subscribers = this.subscribers.get(type);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  private notifySubscribers(type: string, data: any): void {
    const subscribers = this.subscribers.get(type);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }

  // Sport-specific Updates
  async getSportUpdates(sport: Sport): Promise<{
    odds: LiveOdds[];
    injuries: InjuryUpdate[];
    lineMovements: LineMovement[];
    news: BreakingNews[];
  }> {
    const cacheKey = `sport_updates_${sport}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const updates = {
      odds: Array.from(this.liveOdds.values())
        .filter(odds => odds.propId.startsWith(sport)),
      injuries: Array.from(this.injuries.values())
        .filter(injury => injury.team.startsWith(sport)),
      lineMovements: Array.from(this.lineMovements.values())
        .flat()
        .filter(movement => movement.propId.startsWith(sport)),
      news: Array.from(this.breakingNews.values())
        .filter(news => news.title.toLowerCase().includes(sport.toLowerCase())),
    };

    this.setCache(cacheKey, updates);
    return updates;
  }

  // Cache Management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const realTimeUpdates = RealTimeUpdatesService.getInstance(); 