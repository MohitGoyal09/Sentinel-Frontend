'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConnectionStatus,
  WebSocketMessage,
  UseWebSocketReturn,
} from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

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
    if (!userHash || userHash.trim() === '') {
      setConnectionStatus('disconnected');
      // Close existing connection if userHash becomes null
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connect = () => {
      // Don't attempt to reconnect if we've exceeded max attempts
      if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.error('Max WebSocket reconnection attempts reached');
        setConnectionStatus('disconnected');
        return;
      }

      // Validate userHash
      if (!userHash || userHash.trim() === '') {
        console.warn('Invalid userHash, skipping WebSocket connection');
        setConnectionStatus('disconnected');
        return;
      }

      setConnectionStatus('connecting');
      
      try {
        const ws = new WebSocket(`${WS_URL}/${userHash}`);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          setLastPing(new Date());
          reconnectAttemptsRef.current = 0; // Reset attempts on successful connection
        };

        ws.onclose = (event) => {
          setConnectionStatus('disconnected');
          wsRef.current = null;
          
          // Only attempt reconnect if it wasn't a clean close and we have a userHash
          if (!event.wasClean && userHash) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff, max 30s
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (userHash) {
                connect();
              }
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('disconnected');
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            setLastMessage(message);
            
            if (message.type === 'pong') {
              setLastPing(new Date());
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
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
      clearInterval(heartbeatInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
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
      console.warn('Cannot request update: WebSocket is not connected');
    }
  }, []);

  return { connectionStatus, lastMessage, lastPing, requestUpdate };
}
