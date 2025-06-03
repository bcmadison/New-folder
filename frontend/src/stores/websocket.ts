import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WebSocketMessage } from '@/services/websocket';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
}

interface OddsUpdate {
  match_id: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  timestamp: string;
}

interface MatchEvent {
  match_id: string;
  event_type: string;
  event_time: string;
  description: string;
  timestamp: string;
}

interface ModelPrediction {
  match_id: string;
  prediction: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  confidence: number;
  timestamp: string;
}

export const useWebSocketStore = defineStore('websocket', () => {
  // Connection states
  const isLiveMatchesConnected = ref(false);
  const isOddsUpdatesConnected = ref(false);
  const isMatchEventsConnected = ref(false);
  const isModelPredictionsConnected = ref(false);

  // Messages
  const liveMatches = ref<Match[]>([]);
  const oddsUpdates = ref<Map<string, OddsUpdate>>(new Map());
  const matchEvents = ref<Map<string, MatchEvent[]>>(new Map());
  const modelPredictions = ref<Map<string, ModelPrediction>>(new Map());

  // Errors
  const liveMatchesError = ref<Error | null>(null);
  const oddsUpdatesError = ref<Error | null>(null);
  const matchEventsError = ref<Error | null>(null);
  const modelPredictionsError = ref<Error | null>(null);

  // Computed properties
  const hasErrors = computed(() => {
    return (
      liveMatchesError.value ||
      oddsUpdatesError.value ||
      matchEventsError.value ||
      modelPredictionsError.value
    );
  });

  const isAllConnected = computed(() => {
    return (
      isLiveMatchesConnected.value &&
      isOddsUpdatesConnected.value &&
      isMatchEventsConnected.value &&
      isModelPredictionsConnected.value
    );
  });

  // Actions
  function handleLiveMatchesMessage(message: WebSocketMessage) {
    if (message.type === 'live_matches') {
      liveMatches.value = message.data;
    }
  }

  function handleOddsUpdateMessage(message: WebSocketMessage) {
    if (message.type === 'odds_update') {
      const update: OddsUpdate = {
        match_id: message.match_id,
        odds: message.data,
        timestamp: message.timestamp,
      };
      oddsUpdates.value.set(message.match_id, update);
    }
  }

  function handleMatchEventMessage(message: WebSocketMessage) {
    if (message.type === 'match_events') {
      const event: MatchEvent = {
        match_id: message.match_id,
        event_type: message.data.type,
        event_time: message.data.time,
        description: message.data.description,
        timestamp: message.timestamp,
      };

      const events = matchEvents.value.get(message.match_id) || [];
      events.push(event);
      matchEvents.value.set(message.match_id, events);
    }
  }

  function handleModelPredictionMessage(message: WebSocketMessage) {
    if (message.type === 'model_predictions') {
      const prediction: ModelPrediction = {
        match_id: message.data.match_id,
        prediction: message.data.prediction,
        confidence: message.data.confidence,
        timestamp: message.timestamp,
      };
      modelPredictions.value.set(message.data.match_id, prediction);
    }
  }

  function setLiveMatchesConnectionStatus(connected: boolean) {
    isLiveMatchesConnected.value = connected;
  }

  function setOddsUpdatesConnectionStatus(connected: boolean) {
    isOddsUpdatesConnected.value = connected;
  }

  function setMatchEventsConnectionStatus(connected: boolean) {
    isMatchEventsConnected.value = connected;
  }

  function setModelPredictionsConnectionStatus(connected: boolean) {
    isModelPredictionsConnected.value = connected;
  }

  function setLiveMatchesError(error: Error | null) {
    liveMatchesError.value = error;
  }

  function setOddsUpdatesError(error: Error | null) {
    oddsUpdatesError.value = error;
  }

  function setMatchEventsError(error: Error | null) {
    matchEventsError.value = error;
  }

  function setModelPredictionsError(error: Error | null) {
    modelPredictionsError.value = error;
  }

  function clearErrors() {
    liveMatchesError.value = null;
    oddsUpdatesError.value = null;
    matchEventsError.value = null;
    modelPredictionsError.value = null;
  }

  function clearMatchEvents(matchId: string) {
    matchEvents.value.delete(matchId);
  }

  return {
    // State
    isLiveMatchesConnected,
    isOddsUpdatesConnected,
    isMatchEventsConnected,
    isModelPredictionsConnected,
    liveMatches,
    oddsUpdates,
    matchEvents,
    modelPredictions,
    liveMatchesError,
    oddsUpdatesError,
    matchEventsError,
    modelPredictionsError,

    // Computed
    hasErrors,
    isAllConnected,

    // Actions
    handleLiveMatchesMessage,
    handleOddsUpdateMessage,
    handleMatchEventMessage,
    handleModelPredictionMessage,
    setLiveMatchesConnectionStatus,
    setOddsUpdatesConnectionStatus,
    setMatchEventsConnectionStatus,
    setModelPredictionsConnectionStatus,
    setLiveMatchesError,
    setOddsUpdatesError,
    setMatchEventsError,
    setModelPredictionsError,
    clearErrors,
    clearMatchEvents,
  };
}); 