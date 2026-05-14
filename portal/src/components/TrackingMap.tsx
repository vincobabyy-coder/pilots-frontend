import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PublicTracking } from '@/types/tracking';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(color: string, symbol: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;">
      <span class="material-symbols-outlined" style="color:white;font-size:16px;">${symbol}</span>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

const originIcon = makeIcon('#4A7C8C', 'warehouse');
const driverIcon = makeIcon('#C27550', 'local_shipping');
const destIcon   = makeIcon('#EF5350', 'location_on');

interface Props {
  tracking: PublicTracking;
}

export function TrackingMap({ tracking }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false });
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Origin marker
    L.marker([tracking.origin.lat, tracking.origin.lng], { icon: originIcon })
      .bindPopup(`<b>${tracking.origin.name}</b><br>${tracking.origin.address}`)
      .addTo(map);

    // Destination marker
    L.marker([tracking.destination.lat, tracking.destination.lng], { icon: destIcon })
      .bindPopup(`<b>Destination</b><br>${tracking.destination.address}`)
      .addTo(map);

    // Driver / current location
    if (tracking.currentLocation) {
      const dm = L.marker(
        [tracking.currentLocation.lat, tracking.currentLocation.lng],
        { icon: driverIcon }
      )
        .bindPopup(`<b>${tracking.driver?.name ?? 'Driver'}</b>`)
        .addTo(map);
      driverMarkerRef.current = dm;

      // Route polyline: origin → current → destination
      L.polyline(
        [
          [tracking.origin.lat, tracking.origin.lng],
          [tracking.currentLocation.lat, tracking.currentLocation.lng],
          [tracking.destination.lat, tracking.destination.lng],
        ],
        { color: '#4A7C8C', weight: 3, dashArray: '6 4' }
      ).addTo(map);
    }

    // Fit bounds
    const bounds = L.latLngBounds([
      [tracking.origin.lat, tracking.origin.lng],
      [tracking.destination.lat, tracking.destination.lng],
    ]);
    if (tracking.currentLocation) {
      bounds.extend([tracking.currentLocation.lat, tracking.currentLocation.lng]);
    }
    map.fitBounds(bounds, { padding: [40, 40] });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Real-time driver location update
  useEffect(() => {
    if (tracking.currentLocation && driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([
        tracking.currentLocation.lat,
        tracking.currentLocation.lng,
      ]);
    }
  }, [tracking.currentLocation]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ height: 380 }}
    />
  );
}
