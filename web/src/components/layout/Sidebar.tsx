import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  notif?: boolean;
}

const mainItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/></svg>,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 17"/><polyline points="17 6 23 6 23 12"/></svg>,
  },
  {
    path: '/orders',
    label: 'Orders',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  },
  {
    path: '/shipments',
    label: 'Shipments',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 13"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    notif: true,
  },
  {
    path: '/routes',
    label: 'Routes',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6m0 4v6M5.5 9h13m0 6h-13"/></svg>,
  },
  {
    path: '/drivers',
    label: 'Drivers',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    path: '/warehouses',
    label: 'Warehouses',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 7 12 12 22 7"/></svg>,
  },
];

const bottomItems: NavItem[] = [
  {
    path: '/alerts',
    label: 'Fraud Detection',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/><path d="M3 6h18M6 3v3M18 3v3"/></svg>,
    notif: true,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/></svg>,
  },
];

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside
      className="flex flex-col items-center justify-between h-full"
      style={{
        width: 'var(--sidebar-strip)',
        background: 'var(--surface)',
        borderRight: `1px solid var(--border)`,
      }}
    >
      {/* Logo/Branding */}
      <div
        className="flex items-center justify-center shrink-0 cursor-pointer hover:bg-card transition-colors"
        style={{
          width: '100%',
          height: 'var(--sidebar-strip)',
          color: 'var(--ink-1)',
        }}
        title="PILOTS"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>

      {/* Navigation - Main */}
      <nav
        className="flex-1 flex flex-col items-center gap-0 py-2"
        style={{ width: '100%' }}
      >
        {mainItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-center relative transition-colors duration-150 group',
                'hover:bg-card',
                isActive && 'text-teal'
              )
            }
            style={{
              width: '100%',
              height: '48px',
              color: 'var(--ink-3)',
            }}
            title={item.label}
          >
            {({ isActive }) => (
              <>
                <div style={{ color: isActive ? 'var(--teal)' : 'inherit' }}>
                  {item.icon}
                </div>
                {item.notif && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '8px',
                      height: '8px',
                      background: 'var(--amber)',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Divider */}
      <div
        style={{
          width: '40%',
          height: '1px',
          background: 'var(--border)',
          margin: '8px 0',
        }}
      />

      {/* Navigation - Bottom */}
      <nav
        className="flex flex-col items-center gap-0 pb-2"
        style={{ width: '100%' }}
      >
        {bottomItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center justify-center relative transition-colors duration-150',
                'hover:bg-card',
                isActive && 'text-teal'
              )
            }
            style={{
              width: '100%',
              height: '48px',
              color: 'var(--ink-3)',
            }}
            title={item.label}
          >
            {({ isActive }) => (
              <>
                <div style={{ color: isActive ? 'var(--teal)' : 'inherit' }}>
                  {item.icon}
                </div>
                {item.notif && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '8px',
                      height: '8px',
                      background: 'var(--amber)',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Avatar */}
      <button
        onClick={logout}
        style={{
          width: '44px',
          height: '44px',
          margin: '10px 0',
          background: 'var(--ink-1)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          fontSize: '11px',
          fontWeight: '800',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Jonathan · Admin"
      >
        JA
      </button>
    </aside>
  );
}
