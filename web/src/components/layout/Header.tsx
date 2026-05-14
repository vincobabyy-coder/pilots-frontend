import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { state } = useAuth();

  return (
    <header
      style={{
        height: 'var(--topbar-h)',
        background: 'var(--card)',
        borderBottom: `1px solid var(--border)`,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '24px',
        paddingRight: '24px',
        gap: '16px',
        shrinkFlex: 0,
      }}
    >
      <h1 style={{ flex: 1, fontSize: '16px', fontWeight: 500, color: 'var(--ink-1)' }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--teal) 0%, var(--blue) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {state.user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-1)', lineHeight: 1, margin: 0 }}>
              {state.user?.name}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--ink-3)', lineHeight: 1, marginTop: '2px', textTransform: 'capitalize' }}>
              {state.user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
