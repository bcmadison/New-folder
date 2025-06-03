import { OddsData, PrizePicksEntry, PredictionUpdate, MarketUpdate } from '../frontend/src/types/index';


/**
 * Standard structure for messages exchanged over WebSocket.
 */
export interface WebSocketMessage<T = any> {
  type: string; // Message type identifier, e.g., 'LIVE_ODD_UPDATE', 'ENTRY_STATUS_UPDATE'
  payload: T;
  sequence?: number; // Optional: for message ordering
  timestamp?: string; // Optional: ISO 8601 timestamp of when the message was generated
  correlationId?: string; // Optional: for tracking request/response if applicable
}

// --- Specific Payload Types for Incoming Messages ---

/**
 * Payload for when a live odd is updated.
 * Assumes OddsData from src/types/index.ts is the structure of an individual odd.
 */
export type LiveOddUpdatePayload = OddsData;

/**
 * Payload for when a user's entry (bet/parlay) status or details change.
 * Assumes PrizePicksEntry from src/types/index.ts is the structure.
 */
export type EntryUpdatePayload = PrizePicksEntry;

/**
 * Payload for real-time market updates (could be broad, like new props available).
 * Assumes MarketUpdate from src/types/index.ts or a more specific type.
 */
export type MarketUpdatePayload = MarketUpdate;

/**
 * Payload for real-time AI prediction updates.
 * Assumes PredictionUpdate from src/types/index.ts.
 */
export type PredictionStreamPayload = PredictionUpdate;

/**
 * Payload for general notification messages from the server.
 */
export interface NotificationPayload {
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  details?: Record<string, any>;
}

/**
 * Payload for authentication success/failure messages from the server.
 */
export interface AuthStatusPayload {
  status: 'success' | 'failure' | 'required';
  message?: string;
  userId?: string; // On success
}

// --- Specific Message Types (Combining WebSocketMessage with Payloads) ---
// These make it easier to type check messages in the handler

export type LiveOddUpdateMessage = WebSocketMessage<LiveOddUpdatePayload>;
export type EntryUpdateMessage = WebSocketMessage<EntryUpdatePayload>;
export type MarketUpdateMessage = WebSocketMessage<MarketUpdatePayload>;
export type PredictionStreamMessage = WebSocketMessage<PredictionStreamPayload>;
export type NotificationMessage = WebSocketMessage<NotificationPayload>;
export type AuthStatusMessage = WebSocketMessage<AuthStatusPayload>;


// --- Outgoing Message Types (Client to Server) ---

/**
 * Payload for client authentication.
 */
export interface ClientAuthPayload {
  token: string;
}
export type ClientAuthMessage = WebSocketMessage<ClientAuthPayload>;

/**
 * Payload for subscribing to specific data feeds.
 */
export interface SubscriptionPayload {
  feedName: string; // e.g., 'live_odds_nba', 'player_updates_lebron'
  action: 'subscribe' | 'unsubscribe';
  parameters?: Record<string, any>;
}
export type SubscriptionMessage = WebSocketMessage<SubscriptionPayload>;

// Added ActiveSubscription type
export interface ActiveSubscription {
  feedName: string;
  parameters?: Record<string, any>;
}

// Known message type mapping (if you have one)
// ... (WebSocketMessageTypes mapping if it exists) ...

export const WebSocketMessageTypes = {
  // ... (ensure this is defined if used elsewhere, or remove if not)
  PING: 'ping',
  PONG: 'pong',
  CLIENT_AUTH: 'client_auth',
  AUTH_STATUS: 'auth_status',
  CLIENT_SUBSCRIBE: 'client_subscribe',
  CLIENT_UNSUBSCRIBE: 'client_unsubscribe',
  LIVE_ODD_UPDATE: 'live_odd_update',
  ENTRY_UPDATE: 'entry_update',
  MARKET_UPDATE: 'market_update',
  PREDICTION_STREAM: 'prediction_stream',
  SERVER_NOTIFICATION: 'server_notification',
  // Add other types as needed
} as const;

export type KnownWebSocketMessageType = typeof WebSocketMessageTypes[keyof typeof WebSocketMessageTypes]; 