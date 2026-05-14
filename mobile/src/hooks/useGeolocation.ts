import { useState, useEffect, useRef } from 'react';
import { startLocationTracking, stopLocationTracking, LocationPayload } from '@/services/geolocation';

interface GeolocationOptions {
  interval?: number;
  enabled?: boolean;
}

export function useGeolocation({ interval = 10000, enabled = true }: GeolocationOptions = {}) {
  const [location, setLocation] = useState<LocationPayload | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (started.current) return;
    started.current = true;

    startLocationTracking(interval, (loc) => {
      setLocation(loc);
      setHasPermission(true);
    }).catch(() => {
      setHasPermission(false);
    });

    return () => {
      stopLocationTracking();
      started.current = false;
    };
  }, [enabled, interval]);

  return { location, hasPermission };
}
