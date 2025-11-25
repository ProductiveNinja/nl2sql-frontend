/**
 * websocketService.ts
 * 
 * Low-level WebSocket service for communication with backend.
 * - Provides connect() function to establish WebSocket connection
 * - Provides disconnect() function to close connection
 * - Provides send() function to send messages to backend
 * - Handles WebSocket events: onopen, onmessage, onerror, onclose
 * - Manages WebSocket instance lifecycle
 * - Implements message queue for messages sent before connection is ready
 * - Exports singleton instance or factory function
 */

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketServiceCallbacks {
  onStateChange?: (state: ConnectionState) => void;
  onMessage?: (message: any) => void;
  onError?: (error: Event) => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string = '';
  private callbacks: WebSocketServiceCallbacks = {};
  private messageQueue: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  setCallbacks(callbacks: WebSocketServiceCallbacks) {
    this.callbacks = callbacks;
  }

  connect(url: string): void {
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.url = url;
    this.notifyStateChange('connecting');

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyStateChange('connected');
        this.flushMessageQueue();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.callbacks.onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.callbacks.onMessage?.(event.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyStateChange('error');
        this.callbacks.onError?.(error);
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.notifyStateChange('disconnected');
        this.socket = null;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.notifyStateChange('error');
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  send(message: any): void {
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(messageString);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      // Queue message if not connected
      this.messageQueue.push(messageString);
      console.warn('WebSocket is not connected. Message queued.');
    }
  }

  sendQuery(query: string, config: { DATABASE: string; LLM_BACKEND: string }): void {
    const message = {
      query,
      config: {
        DATABASE: config.DATABASE,
        LLM_BACKEND: config.LLM_BACKEND
      }
    };
    this.send(message);
  }

  private notifyStateChange(state: ConnectionState): void {
    this.callbacks.onStateChange?.(state);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.send(message);
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.socket?.readyState !== WebSocket.OPEN) {
          this.connect(this.url);
        }
      }, this.reconnectDelay);
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  getConnectionState(): ConnectionState {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'error';
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();