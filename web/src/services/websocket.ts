const WS_URL = import.meta.env.VITE_WS_URL as string;

export type WsEvent =
  | 'driver_location'
  | 'shipment_status'
  | 'alert_new'
  | 'eta_update'
  | 'event_log'
  | 'route_update';

type Handler = (data: unknown) => void;

class PilotsWebSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<WsEvent, Set<Handler>>();
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private shouldReconnect = false;
  private token: string | null = null;

  connect(token: string): void {
    this.token = token;
    this.shouldReconnect = true;
    this.openConnection();
  }

  private openConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = `${WS_URL}?token=${this.token ?? ''}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.info('[WS] Connected');
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: WsEvent;
          data: unknown;
        };
        const handlers = this.handlers.get(msg.type);
        handlers?.forEach((h) => h(msg.data));
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      if (!this.shouldReconnect) return;
      console.info(`[WS] Reconnecting in ${this.reconnectDelay}ms`);
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
        this.openConnection();
      }, this.reconnectDelay);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  subscribe(event: WsEvent, handler: Handler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }
}

export const wsClient = new PilotsWebSocket();
