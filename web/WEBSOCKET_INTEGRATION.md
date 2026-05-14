# WebSocket Integration Guide

## Overview

The PILOTS Web Dashboard integrates real-time updates via WebSocket for live vehicle tracking, shipment status changes, and alert notifications. The WebSocket connection is automatically established when a user logs in and maintained throughout their session.

## Architecture

### WebSocket Client (`src/services/websocket.ts`)

The `PilotsWebSocket` class manages:
- **Connection lifecycle**: Connect on login, auto-reconnect with exponential backoff
- **Event subscription**: Type-safe event handlers for different message types
- **Automatic reconnection**: Reconnects within 1-30 seconds if connection drops

### Supported Events

```typescript
type WsEvent =
  | 'driver_location'      // Real-time driver GPS updates
  | 'shipment_status'      // Shipment status changes
  | 'alert_new'            // New operational alerts
  | 'eta_update'           // ETA updates for deliveries
  | 'event_log'            // General event logging
  | 'route_update'         // Route modifications
```

### Integration Points

1. **Authentication Context** (`src/context/AuthContext.tsx`)
   - Connects WebSocket on successful login
   - Passes authentication token
   - Disconnects on logout

2. **useWebSocket Hook** (`src/hooks/useWebSocket.ts`)
   - Simple hook for components to subscribe to events
   - Automatic subscription/unsubscription on mount/unmount
   - Type-safe event handling

## Using WebSocket in Components

### Example: Real-Time Map Updates

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
import { DriverLocation } from '@/types/driver';

export function MyComponent() {
  const [location, setLocation] = useState<DriverLocation | null>(null);

  // Subscribe to driver location updates
  useWebSocket<DriverLocation>('driver_location', (data) => {
    setLocation(data);
  });

  return <div>Current location: {location?.lat}, {location?.lng}</div>;
}
```

### Example: Alert Notifications

```typescript
useWebSocket<AlertItem>('alert_new', (alert) => {
  setAlerts((prev) => [alert, ...prev]);
  notify('warning', alert.title);
});
```

## Testing WebSocket Connectivity

### Local Development Setup

1. **Start the backend API**:
   ```bash
   cd /Users/tifeatere/Desktop/GOV/pilots-hq
   npm run dev
   # API runs on http://localhost:3000
   # WebSocket available at ws://localhost:3000/ws
   ```

2. **Start the frontend dev server**:
   ```bash
   cd /Users/tifeatere/Desktop/GOV/pilots-frontend/web
   npm run dev
   # Frontend runs on http://localhost:5173
   ```

3. **Set environment variables** (`.env.local`):
   ```
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_WS_URL=ws://localhost:3000/ws
   ```

### Browser DevTools Testing

1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Filter by "WS" to see WebSocket connections
4. Click on the WebSocket connection to see:
   - Connection URL with auth token
   - Messages sent and received
   - Connection status and timing

### Manual Testing Checklist

- [ ] **Login**: User authenticates successfully
- [ ] **WebSocket Connection**: 
  - Connection established in Network tab
  - No connection errors in Console
  - Token is passed in URL query params
- [ ] **Live Map**: 
  - Driver markers appear on map
  - Markers update as location changes (every few seconds)
  - WebSocket messages show in Network tab
- [ ] **Real-Time Alerts**:
  - New alerts appear without page refresh
  - Alert notifications trigger in UI
  - Old alerts still visible in Alerts page
- [ ] **Shipment Status Updates**:
  - Shipment status changes reflected in real-time
  - Dashboard shipment table updates live
  - No page refresh needed
- [ ] **Disconnection Handling**:
  - Close backend API
  - Verify "last updated X mins ago" appears on stale data
  - Reconnection attempts after API restart
  - Connection recovers automatically

### Monitoring WebSocket Traffic

Enable WebSocket logging in the browser console:

```javascript
// In browser console
localStorage.setItem('DEBUG_WS', 'true');
window.location.reload();
```

Then check Console for WebSocket event logs.

## Message Format

### Incoming Messages

All WebSocket messages follow this format:

```json
{
  "type": "driver_location",
  "data": {
    "driverId": "driver-123",
    "lat": 6.5244,
    "lng": 3.3792,
    "speed": 45,
    "timestamp": "2026-05-04T10:30:45Z"
  }
}
```

### Subscription (Optional)

To subscribe to specific rooms:

```json
{
  "action": "join",
  "room": "shipment:abc-123"
}
```

## Performance Considerations

### Optimizations in Place

1. **Marker Clustering**: Large numbers of driver markers are efficiently managed
2. **Debouncing**: Frequent location updates don't cause excessive re-renders
3. **Lazy Loading**: Chart and map data loads asynchronously
4. **Virtual Scrolling**: Order lists with 1000+ items render efficiently

### Connection Pooling

The WebSocket maintains a single connection per user session. All event subscriptions multiplex over this single connection.

### Data Freshness

Stale data (older than 2 minutes) is marked with "last updated X mins ago" timestamps:

```typescript
// In components showing live data
const isStale = Date.now() - new Date(lastUpdated).getTime() > 2 * 60 * 1000;
if (isStale) {
  // Show "Last updated 5 mins ago" indicator
}
```

## Troubleshooting

### WebSocket Connection Failed

**Symptoms**: Console shows "WebSocket connection failed" or "ECONNREFUSED"

**Solutions**:
1. Verify backend API is running: `curl http://localhost:3000/api/v1/health`
2. Check `.env.local` VITE_WS_URL matches backend host/port
3. Check browser console for CORS/security errors
4. Verify auth token is present in localStorage

### Events Not Received

**Symptoms**: Map doesn't update, alerts don't appear in real-time

**Solutions**:
1. Verify WebSocket connection in Network tab
2. Check that backend is publishing events (check backend logs)
3. Verify event type matches the subscription: `'driver_location'` not `'driverLocation'`
4. Check component's useWebSocket hook is properly called

### High Latency / Slow Updates

**Symptoms**: Updates arrive 10+ seconds late

**Solutions**:
1. Check network bandwidth: Open DevTools Network tab
2. Monitor WebSocket message frequency (should be ~1-2/second for locations)
3. Profile component re-renders: Use React DevTools Profiler
4. Check for memory leaks: Run Lighthouse audit

### Connection Drops Frequently

**Symptoms**: Reconnecting message appears every minute

**Solutions**:
1. Check for proxy/firewall blocking WebSocket upgrades
2. Verify VITE_WS_URL uses `ws://` not `wss://` (unless using HTTPS)
3. Check backend resource limits (ulimit, max connections)
4. Monitor server memory and CPU during connections

## Security Considerations

1. **Token in URL**: Auth token is passed as query parameter. Only works over WSS (TLS) in production
2. **Rate Limiting**: Backend enforces rate limits on message frequency
3. **Validation**: All incoming data is validated before UI updates
4. **XSS Prevention**: Event data is sanitized before rendering

## Pages Using WebSocket

1. **Dashboard** (`DashboardPage.tsx`)
   - `driver_location`: Live vehicle positions
   - `shipment_status`: Real-time shipment updates
   - `alert_new`: New alerts
   - `eta_update`: ETA updates

2. **Map** (component in Dashboard)
   - `driver_location`: Vehicle position updates

3. **Driver Detail** (`DriverDetailPage.tsx`)
   - `driver_location`: Current driver location

4. **Alerts** (`AlertsPage.tsx`)
   - `alert_new`: Real-time alert push

## Future Enhancements

- [ ] Implement message compression for high-frequency updates
- [ ] Add selective subscription (subscribe only to relevant drivers/regions)
- [ ] Implement client-side event queuing during temporary disconnections
- [ ] Add WebSocket metrics to analytics dashboard
- [ ] Support for server-side message filtering based on user permissions
