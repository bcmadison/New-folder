import { 
import { PrizePicksAPI, PrizePicksProjection } from '../api/PrizePicksAPI';

  PrizePicksPlayer, 
  ProcessedPrizePicksProp, 
  PropOption, 
  PRIZEPICKS_CONFIG 
} from '../types/prizePicks';

export class PrizePicksService {
  private static instance: PrizePicksService;
  private cache: Map<string, { data: ProcessedPrizePicksProp; timestamp: number }>;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private api: PrizePicksAPI;

  private constructor() {
    this.cache = new Map();
    this.api = PrizePicksAPI.getInstance();
    this.startUpdateCycle();
  }

  static getInstance(): PrizePicksService {
    if (!PrizePicksService.instance) {
      PrizePicksService.instance = new PrizePicksService();
    }
    return PrizePicksService.instance;
  }

  private startUpdateCycle(): void {
    this.updateInterval = setInterval(
      () => this.refreshData(),
      PRIZEPICKS_CONFIG.UPDATE_INTERVAL
    );
    // Initial fetch
    this.refreshData();
  }

  private async refreshData(): Promise<void> {
    try {
      const projections = await this.api.getProjections('NBA'); // TODO: support other leagues
      this.processAndCacheData(projections);
    } catch (error) {
      console.error('Failed to refresh PrizePicks data:', error);
    }
  }

  private processAndCacheData(projections: PrizePicksProjection[]): void {
    const processed = projections.map(proj => this.processProjection(proj));
    processed.forEach(prop => {
      this.cache.set(this.getCacheKey(prop), {
        data: prop,
        timestamp: Date.now()
      });
    });
    this.cleanCache();
  }

  private processProjection(proj: PrizePicksProjection): ProcessedPrizePicksProp {
    // Use the projection's lineScore and projectedValue for goblin/demon/normal lines
    const originalLine = proj.lineScore;
    const projection = proj.projectedValue;
    const statType = proj.statType;

    const goblinLine = originalLine - this.getGoblinOffset(statType);
    const demonLine = originalLine + this.getDemonOffset(statType);

    const options: PropOption[] = [
      {
        line: goblinLine,
        type: 'goblin',
        icon: '/assets/goblin.svg',
        percentage: this.calculateWinProbability(projection, goblinLine),
        multiplier: this.getGoblinMultiplier()
      },
      {
        line: originalLine,
        type: 'normal',
        icon: '/assets/normal.svg',
        percentage: this.calculateWinProbability(projection, originalLine),
        multiplier: this.getNormalMultiplier()
      },
      {
        line: demonLine,
        type: 'demon',
        icon: '/assets/demon.svg',
        percentage: this.calculateWinProbability(projection, demonLine),
        multiplier: this.getDemonMultiplier()
      }
    ];

    const winningProp = this.determineOptimalProp(options);

    return {
      player_name: proj.playerName,
      team_abbreviation: proj.teamAbbrev,
      position: proj.position,
      opponent_team: proj.opponent,
      sport: proj.league,
      game_time: proj.gameTime,
      pick_count: proj.fireCount?.toString() || '0',
      stat_type: statType,
      line_value: originalLine,
      projected_value: projection,
      confidence_percentage: proj.confidence,
      player_image_url: '', // Optionally map from another API
      goblin_icon_url: '/assets/goblin.svg',
      demon_icon_url: '/assets/demon.svg',
      normal_icon_url: '/assets/normal.svg',
      detailedProps: [{
        stat: statType,
        projectedValue: projection,
        options
      }],
      winningProp
    };
  }

  private calculateWinProbability(projection: number, line: number): number {
    const edge = projection - line;
    const volatility = this.getVolatilityFactor(line);
    const baseProb = 0.5 + (edge / (Math.abs(line) * volatility));
    return Math.max(0, Math.min(1, baseProb));
  }

  private getVolatilityFactor(line: number): number {
    return 0.15 + (line / 100) * 0.05;
  }

  private determineOptimalProp(options: PropOption[]): PropOption {
    return options.reduce((best, current) => {
      const currentEV = current.percentage * current.multiplier;
      const bestEV = best.percentage * best.multiplier;
      return currentEV > bestEV ? current : best;
    });
  }

  private getGoblinOffset(statType: string): number {
    switch (statType.toLowerCase()) {
      case 'points':
        return 2.5;
      case 'rebounds':
      case 'assists':
        return 1.5;
      case 'threes':
        return 1;
      case 'steals':
      case 'blocks':
        return 0.5;
      default:
        return 1;
    }
  }

  private getDemonOffset(statType: string): number {
    return this.getGoblinOffset(statType) * 1.2;
  }

  private getGoblinMultiplier(): number {
    return 1.8;
  }

  private getNormalMultiplier(): number {
    return 2.0;
  }

  private getDemonMultiplier(): number {
    return 2.5;
  }

  private getCacheKey(prop: ProcessedPrizePicksProp): string {
    return `${prop.player_name}_${prop.stat_type}_${prop.game_time}`;
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > PRIZEPICKS_CONFIG.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  public getFilteredProps(filter: 'all' | 'high-confidence' | 'trending' | 'goblins' | 'demons' | 'value-bets'): ProcessedPrizePicksProp[] {
    const allProps = Array.from(this.cache.values()).map(entry => entry.data);
    switch (filter) {
      case 'all':
        return allProps;
      case 'high-confidence':
        return allProps.filter(prop => 
          prop.winningProp.percentage > PRIZEPICKS_CONFIG.HIGH_CONFIDENCE_THRESHOLD
        );
      case 'trending':
        return allProps
          .filter(prop => parseInt(prop.pick_count) > PRIZEPICKS_CONFIG.TRENDING_THRESHOLD)
          .sort((a, b) => parseInt(b.pick_count) - parseInt(a.pick_count));
      case 'goblins':
        return allProps.filter(prop => 
          prop.winningProp.type === 'goblin' && 
          prop.winningProp.percentage > PRIZEPICKS_CONFIG.GOBLIN_CONFIDENCE_THRESHOLD
        );
      case 'demons':
        return allProps.filter(prop => 
          prop.winningProp.type === 'demon' && 
          prop.winningProp.percentage < PRIZEPICKS_CONFIG.DEMON_RISK_THRESHOLD
        );
      case 'value-bets':
        return allProps.filter(prop => {
          const edge = Math.abs(prop.projected_value - prop.line_value);
          return edge > PRIZEPICKS_CONFIG.VALUE_BET_THRESHOLD;
        });
      default:
        return allProps;
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.cache.clear();
  }
} 