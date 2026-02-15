'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConnectionStatus,
  WebSocketMessage,
  UseWebSocketReturn,
} from '@/types';

const BASE_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

/**
 * Hook for managing WebSocket connection to the backend
 * Connects to ws://localhost:8000/ws/{user_hash}
 * 
 * Sends: {"action": "ping"} or {"action": "request_update"}
 * Receives: {"type": "risk_update", "data": {...}} or {"type": "pong"}
 */
export function useWebSocket(userHash: string | null): UseWebSocketReturn {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    // Basic validation
    if (!userHash || userHash.trim() === '' || userHash === 'undefined') {
      if (wsRef.current) {
        console.log('[WebSocket] Closing connection due to invalid userHash:', userHash);
        // Remove listener before closing to avoid triggering reconnect logic
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnectionStatus('disconnected');
      return;
    }

    const connect = () => {
      // Don't attempt to reconnect if we've exceeded max attempts
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('[WebSocket] Max reconnection attempts reached');
        setConnectionStatus('disconnected');
        return;
      }

      setConnectionStatus('connecting');
      
      try {
        const url = `${BASE_WS_URL}/${userHash}`;
        console.log(`[WebSocket] Connecting to: ${url}`);
        
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WebSocket] Connected');
          setConnectionStatus('connected');
          setLastPing(new Date());
          reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
        };

        ws.onclose = (event) => {
          console.log(`[WebSocket] Closed: Code=${event.code}, Reason=${event.reason}, Clean=${event.wasClean}`);
          setConnectionStatus('disconnected');
          wsRef.current = null;
          
          // Only attempt reconnect if it wasn't a clean close and we have a valid userHash
          // And if the code is NOT related to Auth failure (4000/4001)
          if (!event.wasClean && userHash && event.code !== 4000 && event.code !== 4001) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff
            console.log(`[WebSocket] Reconnecting in ${delay}ms (Attempt ${reconnectAttemptsRef.current})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (userHash) {
                // Check userHash content again before reconnecting
                const currentHash = userHash; 
                 // Note: we're using closure variable 'userHash', make sure it's still valid context.
                 // The effect dependency ensures this connect function is scoped to current userHash.
                connect();
              }
            }, delay);
          }
        };

        ws.onerror = (event) => {
          console.error('[WebSocket] Error event:', event);
          setConnectionStatus('disconnected');
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('[WebSocket] Received:', message.type);
            setLastMessage(message);
            
            if (message.type === 'pong') {
              setLastPing(new Date());
            }
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };
      } catch (error) {
        console.error('[WebSocket] Failed to create connection:', error);
        setConnectionStatus('disconnected');
      }
    };

    connect();

    // Heartbeat - send ping every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000);

    return () => {
      console.log('[WebSocket] Cleanup hook');
      clearInterval(heartbeatInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on unmount
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userHash]);

  /**
   * Request an immediate update from the server
   * Sends: {"action": "request_update"}
   */
  const requestUpdate = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'request_update' }));
    } else {
      console.warn('[WebSocket] Cannot request update: Not connected');
    }
  }, []);

  return { connectionStatus, lastMessage, lastPing, requestUpdate };
}
