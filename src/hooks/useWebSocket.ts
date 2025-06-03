import { useEffect, useCallback, useRef } from 'react';
import { WSMessage } from '../types';
import useStore from '../store/useStore';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: WSMessage) => void;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  autoReconnect?: boolean;
}

export const useWebSocket = ({
  url,
  onMessage,
  reconnectAttempts = 5,
  reconnectDelay = 1000,
  autoReconnect = true
}: UseWebSocketOptions) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const { addToast } = useStore();

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectCount.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        if (autoReconnect && reconnectCount.current < reconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectCount.current);
          console.log(`Attempting to reconnect in ${delay}ms...`);
          setTimeout(() => {
            reconnectCount.current++;
            connect();
          }, delay);
        } else if (reconnectCount.current >= reconnectAttempts) {
          addToast({
            id: 'ws-error',
            type: 'error',
            title: 'Connection Error',
            message: 'Failed to establish WebSocket connection. Please try again later.'
          });
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, onMessage, reconnectAttempts, reconnectDelay, autoReconnect, addToast]);

  const disconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  }, []);

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.error('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    disconnect,
    reconnect: connect,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
}; 