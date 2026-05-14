import * as Location from 'expo-location';
import { mobileApi } from './api';

export interface LocationPayload {
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

let watchSubscription: Location.LocationSubscription | null = null;

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<LocationPayload | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
    speed: loc.coords.speed ?? undefined,
    heading: loc.coords.heading ?? undefined,
    timestamp: new Date(loc.timestamp).toISOString(),
  };
}

export async function startLocationTracking(
  intervalMs = 10000,
  onUpdate?: (loc: LocationPayload) => void
): Promise<void> {
  const granted = await requestLocationPermission();
  if (!granted) return;

  watchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalMs,
      distanceInterval: 20,
    },
    (loc) => {
      const payload: LocationPayload = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        speed: loc.coords.speed ?? undefined,
        heading: loc.coords.heading ?? undefined,
        timestamp: new Date(loc.timestamp).toISOString(),
      };
      onUpdate?.(payload);
      // POST to backend
      mobileApi.post('/drivers/me/location', [payload]).catch(() => null);
    }
  );
}

export function stopLocationTracking(): void {
  watchSubscription?.remove();
  watchSubscription = null;
}
