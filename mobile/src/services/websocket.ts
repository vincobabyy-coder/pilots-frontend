const WS_URL = process.env.APP_WS_URL ?? 'ws://localhost:3000';

type Handler = (data: unknown) => void;
type WsEvent =
  | 'eta_update'
  | 'alert_new'
  | 'route_update'
  | 'delivery_update'
  | 'new_job'
  | 'job_expired'
  | 'route_optimized'
  | 'shipment_update'
  | 'location_updated'
  | 'subscribed';

class MobileWebSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<WsEvent, Set<Handler>>();
  private reconnectDelay = 1000;
  private shouldReconnect = false;
  private token: string | null = null;
  private messageQueue: unknown[] = [];

  connect(token: string): void {
    this.token = token;
    this.shouldReconnect = true;
    this.openConnection();
  }

  private openConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket(`${WS_URL}?token=${this.token ?? ''}`);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      // Flush queued messages
      this.messageQueue.forEach((m) => this.ws?.send(JSON.stringify(m)));
      this.messageQueue = [];
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as { type: WsEvent; data: unknown };
        this.handlers.get(msg.type)?.forEach((h) => h(msg.data));
      } catch {
        // ignore
      }
    };

    this.ws.onclose = () => {
      if (!this.shouldReconnect) return;
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
        this.openConnection();
      }, this.reconnectDelay);
    };
  }

  subscribe(event: WsEvent, handler: Handler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.messageQueue.push(data);
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
  }
}

export const mobileWs = new MobileWebSocket();
