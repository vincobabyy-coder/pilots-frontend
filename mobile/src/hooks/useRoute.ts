import { useState, useCallback, useEffect } from 'react';
import { mobileApi } from '@/services/api';
import { Route, RouteStop } from '@/types/delivery';
import { mobileWs } from '@/services/websocket';

export interface UseRouteResult {
  currentRoute: Route | null;
  nextStops: RouteStop[];
  loading: boolean;
  error: string | null;
  refreshRoute: () => Promise<void>;
}

/**
 * Hook to fetch and monitor the driver's current active route
 * Updates via WebSocket when route is optimized or new jobs are added
 */
export function useRoute(): UseRouteResult {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [nextStops, setNextStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshRoute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch driver's current route
      const response = await mobileApi.get<{ route: Route | null }>('/drivers/me/route');
      const route = response.route;

      if (route && route.stops && route.stops.length > 0) {
        setCurrentRoute(route);
        // Get next 3 stops
        setNextStops(route.stops.slice(0, 3));
      } else {
        setCurrentRoute(null);
        setNextStops([]);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch route');
      setCurrentRoute(null);
      setNextStops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to route update events
  useEffect(() => {
    const unsubscribeRouteUpdate = mobileWs.subscribe('route_update', () => {
      refreshRoute().catch(() => null);
    });

    const unsubscribeRouteOptimized = mobileWs.subscribe('route_optimized', () => {
      refreshRoute().catch(() => null);
    });

    return () => {
      unsubscribeRouteUpdate();
      unsubscribeRouteOptimized();
    };
  }, [refreshRoute]);

  // Initial load
  useEffect(() => {
    refreshRoute().catch(() => null);
  }, [refreshRoute]);

  return {
    currentRoute,
    nextStops,
    loading,
    error,
    refreshRoute,
  };
}
