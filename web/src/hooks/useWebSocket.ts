import { useEffect, useRef } from 'react';
import { wsClient, WsEvent } from '@/services/websocket';

export function useWebSocket<T>(event: WsEvent, handler: (data: T) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const unsubscribe = wsClient.subscribe(event, (data) => {
      handlerRef.current(data as T);
    });
    return unsubscribe;
  }, [event]);
}
