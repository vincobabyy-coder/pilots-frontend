import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DriverLocation } from '@/types/driver';
import { Warehouse } from '@/services/warehouses.service';
import { Shipment } from '@/types/shipment';
import { useWebSocket } from '@/hooks/useWebSocket';

// Fix Leaflet default icon path (Vite issue)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(color: string, symbol: string) {
  return L.divIcon({
    className: '',
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.25);border:2px solid white;">
      <span class="material-symbols-outlined" style="color:white;font-size:16px;">${symbol}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function makePopupContent(type: 'driver' | 'warehouse' | 'shipment', data: unknown): string {
  if (type === 'driver') {
    const d = data as DriverLocation;
    return `
      <div style="min-width:150px;">
        <b>Driver Location</b><br>
        <span style="font-size:12px;color:#666;">Speed: ${d.speed ?? 0}km/h</span><br>
        <span style="font-size:12px;color:#666;">Updated: ${new Date(d.timestamp).toLocaleTimeString()}</span>
      </div>
    `;
  } else if (type === 'warehouse') {
    const w = data as Warehouse;
    return `<b>${w.name}</b><br><span style="font-size:12px;color:#666;">${w.address}</span>`;
  } else {
    const s = data as Shipment;
    return `<b>${s.trackingNumber}</b><br><span style="font-size:12px;color:#666;">${s.destination.city}</span>`;
  }
}

const driverIcon    = makeIcon('#4A7C8C', 'local_shipping');
const warehouseIcon = makeIcon('#C27550', 'warehouse');
const shipmentIcon  = makeIcon('#D4A574', 'package_2');

interface LiveMapProps {
  drivers?: DriverLocation[];
  warehouses?: Warehouse[];
  shipments?: Shipment[];
  onDriverClick?: (driver: DriverLocation) => void;
  height?: string;
  className?: string;
  showTrackingHistory?: boolean;
}

export function LiveMap({
  drivers = [],
  warehouses = [],
  shipments = [],
  onDriverClick,
  height = '450px',
  className,
  showTrackingHistory = false,
}: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverMarkers = useRef<Map<string, L.Marker>>(new Map());
  const driverTrails = useRef<Map<string, L.Polyline>>(new Map());

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [6.5244, 3.3792], // Lagos default
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Add warehouse + shipment markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear all non-driver markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer !== driverMarkers.current.get('any')) {
        if (!driverMarkers.current.has(layer.getLatLng().toString())) {
          map.removeLayer(layer);
        }
      }
    });

    warehouses.forEach((wh) => {
      const marker = L.marker([wh.lat, wh.lng], { icon: warehouseIcon });
      marker.bindPopup(makePopupContent('warehouse', wh));
      marker.addTo(map);
    });

    shipments.forEach((s) => {
      if (s.currentLocation) {
        const marker = L.marker([s.currentLocation.lat, s.currentLocation.lng], { icon: shipmentIcon });
        marker.bindPopup(makePopupContent('shipment', s));
        marker.addTo(map);
      }
    });
  }, [warehouses, shipments]);

  // Add initial driver markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    drivers.forEach((d) => {
      const marker = L.marker([d.lat, d.lng], { icon: driverIcon });
      marker.bindPopup(makePopupContent('driver', d));
      marker.on('click', () => {
        if (onDriverClick) onDriverClick(d);
      });
      marker.addTo(map);
      driverMarkers.current.set(d.driverId, marker);
    });
  }, [drivers, onDriverClick]);

  // Real-time driver location updates via WebSocket
  useWebSocket<DriverLocation>('driver_location', (loc) => {
    const map = mapRef.current;
    if (!map) return;

    const existing = driverMarkers.current.get(loc.driverId);
    const newLatLng = [loc.lat, loc.lng] as [number, number];

    if (existing) {
      existing.setLatLng(newLatLng);
      existing.setPopupContent(makePopupContent('driver', loc));

      // Update trail if tracking
      if (showTrackingHistory) {
        let trail = driverTrails.current.get(loc.driverId);
        if (!trail) {
          trail = L.polyline([newLatLng], { color: '#4A7C8C', weight: 2, opacity: 0.5 }).addTo(map);
          driverTrails.current.set(loc.driverId, trail);
        } else {
          const latLngs = trail.getLatLngs() as L.LatLng[];
          trail.setLatLngs([...latLngs, L.latLng(newLatLng)]);
        }
      }
    } else {
      const marker = L.marker(newLatLng, { icon: driverIcon });
      marker.bindPopup(makePopupContent('driver', loc));
      marker.on('click', () => {
        if (onDriverClick) onDriverClick(loc);
      });
      marker.addTo(map);
      driverMarkers.current.set(loc.driverId, marker);
    }
  });

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className={`rounded-xl overflow-hidden border border-border ${className ?? ''}`}
    />
  );
}
