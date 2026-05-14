import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trackingService } from '@/services/tracking.service';
import { PublicTracking } from '@/types/tracking';
import { TrackingTimeline } from '@/components/TrackingTimeline';
import { TrackingMap } from '@/components/TrackingMap';

const WS_URL = import.meta.env.VITE_WS_URL as string;

function statusLabel(status: PublicTracking['status']): string {
  const map: Record<PublicTracking['status'], string> = {
    created: 'Order Placed',
    picked: 'Picked & Packed',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
  };
  return map[status] ?? status;
}

function statusColor(status: PublicTracking['status']): string {
  if (status === 'delivered') return 'text-green-600 bg-green-50';
  if (status === 'out_for_delivery') return 'text-[#C27550] bg-orange-50';
  if (status === 'in_transit') return 'text-[#4A7C8C] bg-teal-50';
  return 'text-gray-600 bg-gray-100';
}

export default function TrackingDetailPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const [tracking, setTracking] = useState<PublicTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Load tracking data
  useEffect(() => {
    if (!trackingNumber) return;
    setLoading(true);
    trackingService
      .lookup(trackingNumber)
      .then((data) => {
        setTracking(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(
          err.message === 'not_found'
            ? 'Shipment not found.'
            : 'Failed to load tracking info. Please try again.'
        );
        setLoading(false);
      });
  }, [trackingNumber]);

  // WebSocket for real-time ETA + driver location updates
  useEffect(() => {
    if (!tracking || !WS_URL) return;

    const ws = new WebSocket(`${WS_URL}/tracking/${encodeURIComponent(tracking.trackingNumber)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          payload: Partial<PublicTracking>;
        };

        if (msg.type === 'eta_update') {
          setTracking((prev) =>
            prev ? { ...prev, eta: msg.payload.eta ?? prev.eta, status: msg.payload.status ?? prev.status } : prev
          );
        }

        if (msg.type === 'driver_location' && msg.payload.currentLocation) {
          setTracking((prev) =>
            prev ? { ...prev, currentLocation: msg.payload.currentLocation } : prev
          );
        }

        if (msg.type === 'event_log' && msg.payload.events) {
          setTracking((prev) =>
            prev ? { ...prev, events: msg.payload.events ?? prev.events } : prev
          );
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [tracking?.trackingNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    if (!tracking) return;
    navigator.clipboard.writeText(tracking.trackingNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-gray-50">
        <header className="px-6 py-5 flex items-center gap-3 bg-white border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#C27550] flex items-center justify-center shadow">
            <span className="material-symbols-outlined text-white text-[20px]">flight_takeoff</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">PILOTS</span>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded-xl w-2/3" />
          <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-96 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error || !tracking) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col">
        <header className="px-6 py-5 flex items-center gap-3 bg-white border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-[#C27550] flex items-center justify-center shadow">
            <span className="material-symbols-outlined text-white text-[20px]">flight_takeoff</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">PILOTS</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">search_off</span>
          <p className="text-gray-600 mb-6">{error || 'Shipment not found.'}</p>
          <Link
            to="/"
            className="h-12 px-6 rounded-2xl bg-[#C27550] text-white font-semibold hover:bg-[#A85E3A] transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Search Again
          </Link>
        </div>
      </div>
    );
  }

  const sortedEvents = [...tracking.events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-9 h-9 rounded-xl bg-[#C27550] flex items-center justify-center shadow shrink-0">
              <span className="material-symbols-outlined text-white text-[20px]">flight_takeoff</span>
            </Link>
            <span className="text-lg font-bold text-gray-900 tracking-tight">PILOTS</span>
          </div>

          {/* Tracking number + copy */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-sm font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <span className="truncate max-w-[180px]">{tracking.trackingNumber}</span>
            <span className="material-symbols-outlined text-[14px] shrink-0">
              {copied ? 'check' : 'content_copy'}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-16">

        {/* ── Shipment Info Card ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Order Date</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(tracking.orderDate).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${statusColor(tracking.status)}`}
            >
              {statusLabel(tracking.status)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Recipient</p>
              <p className="text-sm font-medium text-gray-800">{tracking.customer}</p>
            </div>
            {tracking.eta && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Estimated Delivery</p>
                <p className="text-sm font-semibold text-[#C27550]">
                  {new Date(tracking.eta).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-xs text-gray-400 mb-0.5">Destination</p>
              <p className="text-sm text-gray-700">
                {tracking.destination.address}, {tracking.destination.city}
              </p>
            </div>
            {tracking.distance != null && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Distance Remaining</p>
                <p className="text-sm font-medium text-gray-800">
                  {tracking.distance.toFixed(1)} km
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Live Map ── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Live Map</h2>
          <TrackingMap tracking={tracking} />
        </div>

        {/* ── Delivery Progress ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">Delivery Progress</h2>
          <TrackingTimeline currentStatus={tracking.status} events={tracking.events} />
        </div>

        {/* ── Driver Card (only when driver assigned + in transit) ── */}
        {tracking.driver && tracking.status !== 'created' && tracking.status !== 'picked' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Your Driver</h2>
            <div className="flex items-center gap-4">
              {tracking.driver.avatar ? (
                <img
                  src={tracking.driver.avatar}
                  alt={tracking.driver.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#C27550]/10 flex items-center justify-center border-2 border-[#C27550]/20">
                  <span className="material-symbols-outlined text-[#C27550] text-2xl">person</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{tracking.driver.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{tracking.driver.vehicle}</p>
              </div>
              {tracking.driver.phone && tracking.status !== 'delivered' && (
                <a
                  href={`tel:${tracking.driver.phone}`}
                  className="w-11 h-11 rounded-full bg-[#4A7C8C]/10 flex items-center justify-center hover:bg-[#4A7C8C]/20 transition-colors shrink-0"
                  aria-label="Call driver"
                >
                  <span className="material-symbols-outlined text-[#4A7C8C] text-[20px]">call</span>
                </a>
              )}
            </div>

            {tracking.currentLocation && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                <span className="material-symbols-outlined text-[16px] text-[#C27550]">location_on</span>
                <span>
                  {tracking.currentLocation.lat.toFixed(4)}, {tracking.currentLocation.lng.toFixed(4)}
                </span>
                <span className="text-gray-300 mx-1">·</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                  Live
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── Events Log ── */}
        {sortedEvents.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Activity Log
            </h2>
            <div className="space-y-3">
              {sortedEvents.map((ev) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-[#C27550] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{ev.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(ev.timestamp).toLocaleString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Delivered Banner ── */}
        {tracking.status === 'delivered' && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
            <span className="material-symbols-outlined text-green-500 text-3xl">check_circle</span>
            <div>
              <p className="font-semibold text-green-800">Package Delivered</p>
              <p className="text-sm text-green-600">Thank you for choosing PILOTS Logistics.</p>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PILOTS Logistics. All rights reserved.
      </footer>
    </div>
  );
}
