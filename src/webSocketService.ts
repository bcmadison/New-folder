import {
import { getInitializedUnifiedConfig } from '../core/UnifiedConfig';
import { useAppStore } from '../store/useAppStore';

// Placeholder for WebSocketService
// This service will manage WebSocket connections for real-time data updates.

  WebSocketMessage,
  WebSocketMessageTypes,
  ClientAuthMessage,
  SubscriptionMessage,
  KnownWebSocketMessageType,
  LiveOddUpdateMessage,
  EntryUpdateMessage,
  MarketUpdateMessage,
  PredictionStreamMessage,
  NotificationMessage,
  AuthStatusMessage,
  ActiveSubscription
} from '../../../shared/webSocket';

const PING_INTERVAL = 30000; // 30 seconds
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const RECONNECT_JITTER = 500; // ms to add/subtract for jitter

let socket: WebSocket | null = null;
let pingTimeout: NodeJS.Timeout | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let currentWsUrl: string = ''; // Store the URL used for the current connection attempt
let reconnectAttempts = 0;

// Callback types
type OnMessageHandler = (type: KnownWebSocketMessageType, payload: any) => void;
type OnErrorFunction = (error: Event) => void;
type OnCloseFunction = (event: CloseEvent) => void;

interface WebSocketServiceControls {
  connect: (
    onMessage: OnMessageHandler,
    onError?: OnErrorFunction,
    onClose?: OnCloseFunction
  ) => void;
  disconnect: (force?: boolean) => void;
  sendMessage: <T>(type: KnownWebSocketMessageType, payload: T) => void;
  subscribe: (feedName: string, parameters?: Record<string, any>) => void;
  unsubscribe: (feedName: string) => void;
  getSocketState: () => number | undefined;
}

const clearTimeouts = () => {
  if (pingTimeout) clearInterval(pingTimeout);
  pingTimeout = null;
  if (reconnectTimeout) clearTimeout(reconnectTimeout);
  reconnectTimeout = null;
};

const heartbeat = () => {
  if (pingTimeout) clearInterval(pingTimeout);
  pingTimeout = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      
      socket.send(JSON.stringify({ type: WebSocketMessageTypes.PING, payload: { timestamp: Date.now() } }));
    } else {
      // Socket not open, try to reconnect if appropriate
      console.warn('[WebSocket] Ping failed: socket not open. Attempting reconnect.');
      webSocketService.disconnect(); // This will trigger reconnect logic
    }
  }, PING_INTERVAL);
};

const handleAuthentication = () => {
  const token = useAppStore.getState().token;
  if (token) {
    
    const authMessage: ClientAuthMessage = {
      type: WebSocketMessageTypes.CLIENT_AUTH,
      payload: { token },
    };
    socket?.send(JSON.stringify(authMessage));
  } else {
    console.warn('[WebSocket] No auth token found. Connection will be unauthenticated.');
    // Potentially request auth from server or wait for login
  }
};

function getWebSocketUrl(): string {
  let config;
  try {
    config = getInitializedUnifiedConfig();
  } catch (e) {
    throw new Error('WebSocket URL requested before UnifiedConfig was initialized. Ensure initializeUnifiedConfig() is awaited before any WebSocket connections.');
  }
  return config.getApiEndpoint('live')?.replace(/^http/, 'ws') || 'ws://localhost:8000/ws/live-updates';
}

const webSocketService: WebSocketServiceControls = {
  connect: (onMessage, onError, onClose) => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      
      return;
    }

    clearTimeouts(); // Clear any existing reconnect attempts or pings

    // Determine client_id
    const userId = useAppStore.getState().user?.id;
    const existingClientId = useAppStore.getState().webSocketClientId; // Get from store if persisted
    let clientIdToUse = existingClientId;

    if (!clientIdToUse) {
        clientIdToUse = userId || `anon_client_${Math.random().toString(36).substring(2, 10)}`;
        useAppStore.getState().setWebSocketClientId(clientIdToUse); // Save to store
    }
    
    currentWsUrl = `${getWebSocketUrl()}?client_id=${encodeURIComponent(clientIdToUse)}`;

    
    try {
        socket = new WebSocket(currentWsUrl);
    } catch (e) {
        console.error("[WebSocket] Error creating WebSocket:", e);
        if(onError) onError(new Event('creation_error')); // Pass a generic event
        // Attempt reconnect with a fresh URL construction next time
        reconnectTimeout = setTimeout(() => {
            webSocketService.connect(onMessage, onError, onClose);
        }, INITIAL_RECONNECT_DELAY);
        return;
    }

    socket.onopen = () => {
      
      heartbeat(); // Start pinging
      handleAuthentication(); // Attempt to authenticate
      // Resubscribe to any feeds
      const subscriptions = useAppStore.getState().activeSubscriptions;
      if (subscriptions && subscriptions.length > 0) {
        
        subscriptions.forEach(sub => {
          // Call the local subscribe function which will send the message and update the store (though it's already in store)
          // No, actually just send the message directly to avoid re-adding to store here.
          const payload: SubscriptionMessage['payload'] = { feedName: sub.feedName, action: 'subscribe', parameters: sub.parameters };
          webSocketService.sendMessage(WebSocketMessageTypes.CLIENT_SUBSCRIBE, payload);
        });
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as WebSocketMessage;
        

        // Type guard based on message.type before calling onMessage
        // This ensures payload is correctly typed for the handler
        switch (message.type) {
          case WebSocketMessageTypes.LIVE_ODD_UPDATE:
            onMessage(message.type, (message as LiveOddUpdateMessage).payload);
            break;
          case WebSocketMessageTypes.ENTRY_UPDATE:
            onMessage(message.type, (message as EntryUpdateMessage).payload);
            break;
          // Add cases for all KnownWebSocketMessageTypes
          case WebSocketMessageTypes.MARKET_UPDATE:
            onMessage(message.type, (message as MarketUpdateMessage).payload);
            break;
          case WebSocketMessageTypes.PREDICTION_STREAM:
            onMessage(message.type, (message as PredictionStreamMessage).payload);
            break;
          case WebSocketMessageTypes.SERVER_NOTIFICATION:
            onMessage(message.type, (message as NotificationMessage).payload);
            break;
          case WebSocketMessageTypes.AUTH_STATUS:
            // Handle auth status specifically, e.g., update store
            const authPayload = (message as AuthStatusMessage).payload;
            useAppStore.getState().setWebSocketAuthStatus(authPayload.status);
            
            onMessage(message.type, authPayload);
            break;
          case WebSocketMessageTypes.PONG: // Server responds to our PING
            
            // Could add logic to check pong timestamp for latency
            break;
          default:
            console.warn('[WebSocket] Received unknown message type:', message.type);
            onMessage(message.type as KnownWebSocketMessageType, message.payload); // Pass through if type is truly unknown
        }
      } catch (e) {
        console.error('[WebSocket] Error parsing message or in onMessage handler:', e, event.data);
        // Optionally, provide raw data to handler if parsing fails but handler might expect it
        // onMessage('RAW_UNPARSED', event.data);
      }
    };

    socket.onerror = (event) => {
      console.error('[WebSocket] Error:', event);
      if (onError) onError(event);
      // Do not attempt reconnect here, onclose will handle it
    };

    socket.onclose = (event) => {
      
      clearTimeouts(); // Stop pings
      socket = null;
      useAppStore.getState().setWebSocketAuthStatus(null); // Reset auth status on close
      if (onClose) onClose(event);

      if (event.code !== 1000 && !event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        // Exponential backoff with jitter
        let delay = Math.min(MAX_RECONNECT_DELAY, INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts -1));
        delay += Math.floor(Math.random() * (RECONNECT_JITTER * 2)) - RECONNECT_JITTER;
        delay = Math.max(0, delay); // Ensure delay is not negative

        
        useAppStore.getState().addToast({ message: `WebSocket disconnected. Reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`, type: 'warning' });
        // Update a global WebSocket status in store if desired
        // useAppStore.getState().setWebSocketConnectionStatus('retrying');

        reconnectTimeout = setTimeout(() => {
          webSocketService.connect(onMessage, onError, onClose);
        }, delay);
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[WebSocket] Max reconnect attempts reached. Giving up.');
        useAppStore.getState().addToast({ message: 'WebSocket disconnected. Max reconnect attempts reached.', type: 'error' });
        // Update a global WebSocket status in store
        // useAppStore.getState().setWebSocketConnectionStatus('failed');
      } else {
        
        reconnectAttempts = 0; // Reset attempts on clean disconnect
        // useAppStore.getState().setWebSocketConnectionStatus('disconnected');
      }
    };
  },

  disconnect: (force = false) => {
    clearTimeouts();
    reconnectAttempts = 0; // Reset reconnect attempts when explicitly disconnecting
    if (socket) {
      if (force) {
        
        socket.onclose = (event: CloseEvent) => { // Override onclose to prevent reconnect
          
          if (socket) socket.onclose = null; // Clean up handler
          socket = null;
        };
      } else {
        
      }
      socket.close(force ? 1000 : undefined); // Send normal closure code if forced
    } else {
      
    }
  },

  sendMessage: <T>(type: KnownWebSocketMessageType, payload: T) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage<T> = { type, payload, timestamp: new Date().toISOString() };
      
      socket.send(JSON.stringify(message));
    } else {
      console.error('[WebSocket] Not connected. Cannot send message:', type, payload);
      // Optionally queue messages here to send upon reconnection
    }
  },

  subscribe: (feedName: string, parameters?: Record<string, any>) => {
    const subscription: ActiveSubscription = { feedName, parameters }; // Now uses the imported type
    const payload: SubscriptionMessage['payload'] = { feedName, action: 'subscribe', parameters };
    webSocketService.sendMessage(WebSocketMessageTypes.CLIENT_SUBSCRIBE, payload);
    useAppStore.getState().addSubscription(subscription);
  },

  unsubscribe: (feedName: string) => {
    const payload: SubscriptionMessage['payload'] = { feedName, action: 'unsubscribe' };
    webSocketService.sendMessage(WebSocketMessageTypes.CLIENT_UNSUBSCRIBE, payload);
    useAppStore.getState().removeSubscription(feedName);
  },

  getSocketState: () => {
    return socket?.readyState;
  }
};

export default webSocketService;

/**
 * Example Usage (conceptual):
 *
 * import webSocketService from './webSocketService';
 *
 * useEffect(() => {
 *   const handleIncomingMessage = (data: any) => {
 *     
 *     // Update Zustand store or React state based on data
 *   };
 *
 *   webSocketService.connect(handleIncomingMessage);
 *
 *   return () => {
 *     webSocketService.disconnect();
 *   };
 * }, []);
 *
 * const sendUpdate = () => {
 *   webSocketService.sendMessage({ type: 'user_action', payload: { action: 'placed_bet' } });
 * };
 */ 