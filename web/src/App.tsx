import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Lazy-loaded pages
const LoginPage         = lazy(() => import('@/pages/LoginPage'));
const DashboardPage     = lazy(() => import('@/pages/DashboardPage'));
const OrdersPage        = lazy(() => import('@/pages/OrdersPage'));
const RoutesPage        = lazy(() => import('@/pages/RoutesPage'));
const ShipmentsPage     = lazy(() => import('@/pages/ShipmentsPage'));
const DriversPage       = lazy(() => import('@/pages/DriversPage'));
const DriverDetailPage  = lazy(() => import('@/pages/DriverDetailPage'));
const WarehousesPage    = lazy(() => import('@/pages/WarehousesPage'));
const AnalyticsPage     = lazy(() => import('@/pages/AnalyticsPage'));
const AlertsPage        = lazy(() => import('@/pages/AlertsPage'));
const SettingsPage      = lazy(() => import('@/pages/SettingsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  if (state.isLoading) return <PageLoader />;
  if (!state.isAuthenticated) return <Navigate to="/auth/login" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { state } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/auth/login"
          element={
            state.isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"      element={<DashboardPage />} />
          <Route path="/orders"         element={<OrdersPage />} />
          <Route path="/routes"         element={<RoutesPage />} />
          <Route path="/shipments"      element={<ShipmentsPage />} />
          <Route path="/drivers"        element={<DriversPage />} />
          <Route path="/drivers/:driverId" element={<DriverDetailPage />} />
          <Route path="/warehouses"     element={<WarehousesPage />} />
          <Route path="/analytics"      element={<AnalyticsPage />} />
          <Route path="/alerts"         element={<AlertsPage />} />
          <Route path="/settings"       element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <NotificationProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </NotificationProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
