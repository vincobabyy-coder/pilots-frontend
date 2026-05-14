import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trackingService } from '@/services/tracking.service';

export default function TrackingLookupPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = trackingNumber.trim();
    if (!num) return;

    setError('');
    setLoading(true);
    try {
      await trackingService.lookup(num);
      navigate(`/tracking/${encodeURIComponent(num)}`);
    } catch (err) {
      if (err instanceof Error && err.message === 'not_found') {
        setError('Shipment not found. Check the tracking number and try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-[#4A7C8C]/10 via-gray-50 to-[#C27550]/10 flex flex-col">
      {/* Header */}
      <header className="px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#C27550] flex items-center justify-center shadow">
          <span className="material-symbols-outlined text-white text-[20px]">flight_takeoff</span>
        </div>
        <span className="text-lg font-bold text-gray-900 tracking-tight">PILOTS</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-3xl bg-[#C27550] flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="material-symbols-outlined text-white text-4xl">local_shipping</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Track your shipment</h1>
            <p className="text-gray-500 mt-2">Enter your tracking number to get real-time updates</p>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                search
              </span>
              <input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g., PILOTS-2024-001234"
                className="w-full h-14 pl-11 pr-4 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-[#C27550] shadow-sm"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">error</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !trackingNumber.trim()}
              className="w-full h-14 rounded-2xl bg-[#C27550] text-white font-semibold text-base hover:bg-[#A85E3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">search</span>
                  Track Shipment
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Tracking number is on your order confirmation email
          </p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PILOTS Logistics. All rights reserved.
      </footer>
    </div>
  );
}
