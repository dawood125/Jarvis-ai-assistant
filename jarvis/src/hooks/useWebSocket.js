import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useWebSocket - Connect to Python backend WebSocket
 * Based on Master Plan v1.0 Section 4 - connects to FastAPI ws://localhost:8000/ws
 */
export function useWebSocket(onMessage) {
  const [status, setStatus] = useState('disconnected');
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const wsUrl = import.meta.env.VITE_MODEL_BRIDGE_URL?.replace('http', 'ws') + '/ws'
      || 'ws://localhost:8000/ws';

    try {
      setStatus('connecting');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setStatus('connected');
        console.log('[WS] Connected to JARVIS backend');
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        try {
          const payload = JSON.parse(event.data);
          onMessage?.(payload);
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setStatus('error');
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus('disconnected');

        // Auto-reconnect after 3 seconds
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (e) {
      setStatus('error');
    }
  }, [onMessage]);

  const sendMessage = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', text }));
      return true;
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    mountedRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    status,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}
