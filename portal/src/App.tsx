import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const TrackingLookupPage = lazy(() => import('@/pages/TrackingLookupPage'));
const TrackingDetailPage = lazy(() => import('@/pages/TrackingDetailPage'));

function PageSpinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50">
      <svg className="animate-spin h-8 w-8 text-[#C27550]" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/" element={<TrackingLookupPage />} />
            <Route path="/tracking/:trackingNumber" element={<TrackingDetailPage />} />
            {/* Catch-all → lookup */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
