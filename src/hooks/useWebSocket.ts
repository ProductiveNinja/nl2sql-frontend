/**
 * useWebSocket.ts
 * 
 * Custom React hook for managing WebSocket connection.
 * - Establishes and maintains WebSocket connection to backend
 * - Returns connection state: 'connecting' | 'connected' | 'disconnected' | 'error'
 * - Provides sendMessage function for sending queries to backend
 * - Handles incoming messages and triggers callbacks
 * - Manages reconnection logic on connection loss
 * - Cleans up connection on component unmount
 * - Uses websocketService for low-level WebSocket operations
 */

import { useState, useEffect, useCallback } from 'react';
import { websocketService } from '../services/websocketService';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
type ConnectionState = ConnectionStatus; // Keep backward compatibility

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  status: ConnectionStatus; // Add status property for backward compatibility
  sendMessage: (message: any) => void;
  sendQuery: (query: string, config: { DATABASE: string; LLM_BACKEND: string }) => void;
  lastMessage: any;
}

export const useWebSocket = (url: string): UseWebSocketReturn => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);

  const sendMessage = useCallback((message: any) => {
    websocketService.send(message);
  }, []);

  const sendQuery = useCallback((query: string, config: { DATABASE: string; LLM_BACKEND: string }) => {
    websocketService.sendQuery(query, config);
  }, []);

  useEffect(() => {
    // Set up callbacks for the websocket service
    websocketService.setCallbacks({
      onStateChange: (state) => {
        setConnectionState(state);
      },
      onMessage: (message) => {
        setLastMessage(message);
      },
      onError: (error) => {
        console.error('WebSocket error received in hook:', error);
      }
    });

    // Connect to the WebSocket
    websocketService.connect(url);

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, [url]);

  return {
    connectionState,
    status: connectionState, // Provide status as alias to connectionState
    sendMessage,
    sendQuery,
    lastMessage
  };
};