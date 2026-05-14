import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/common/Toast';

const pageTitles: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/orders':     'Orders',
  '/routes':     'Routes',
  '/shipments':  'Shipments',
  '/drivers':    'Drivers',
  '/warehouses': 'Warehouses',
  '/analytics':  'Analytics',
  '/alerts':     'Alerts',
  '/settings':   'Settings',
};

export function MainLayout() {
  const location = useLocation();
  const title = pageTitles[location.pathname] ?? 'PILOTS';

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Header title={title} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
