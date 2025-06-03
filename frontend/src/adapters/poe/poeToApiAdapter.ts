import {
import { PoePlayer } from './types';
import { poeToApiAdapter } from './poeToApiAdapter';

  PoePlayer,
  ApiProp,
  ApiOdds,
  ApiSentiment,
  ApiNews,
  MyApiFormat
} from './types';

export function poeToApiAdapter(poePlayers: PoePlayer[]): MyApiFormat {
  if (!Array.isArray(poePlayers)) poePlayers = [];

  const props: ApiProp[] = [];
  const odds: ApiOdds[] = [];
  const sentiment: { [playerId: string]: ApiSentiment } = {};
  const news: ApiNews[] = [];

  for (const player of poePlayers) {
    const playerId = player.id || '';
    const playerName = player.player || 'Unknown Player';
    const team = player.team || 'N/A';

    // Props
    if (Array.isArray(player.props)) {
      for (const prop of player.props) {
        props.push({
          playerId,
          playerName,
          team,
          stat: prop.stat || 'Unknown',
          line: prop.currentLine ?? 0,
          type: prop.type || 'normal',
          percentage: prop.percentage ?? 0,
          odds: prop.odds ?? '',
          confidence: prop.confidence ?? '',
          emoji: prop.emoji ?? '',
        });
      }
    }

    // Odds (from detailedProps.options)
    if (Array.isArray(player.detailedProps)) {
      for (const det of player.detailedProps) {
        if (Array.isArray(det.options)) {
          for (const opt of det.options) {
            odds.push({
              playerId,
              stat: det.stat || 'Unknown',
              line: opt.line ?? 0,
              odds: opt.odds ?? '',
              sportsbook: '', // Not available in Poe, fallback empty
            });
          }
        }
      }
    }

    // Sentiment
    sentiment[playerId] = {
      direction: player.sentiment?.direction ?? 'neutral',
      score: player.sentiment?.score ?? 0,
      tooltip: player.sentiment?.tooltip ?? '',
    };

    // News
    if (player.espnNews) {
      news.push({
        playerId,
        headline: player.espnNews,
        source: 'ESPN',
        time: player.gameTime ?? '',
      });
    }
  }

  return { props, odds, sentiment, news };
}

/*
// Usage Example:

const poeData: PoePlayer[] = []; // ...Poe mock data...
const apiData = poeToApiAdapter(poeData);
// apiData is now in your API format: { props: [], odds: [], sentiment: {}, news: [] }
*/ 