import { clsx } from 'clsx';

interface KpiCardProps {
  title: string;
  value: string | number;
  delta?: number;
  unit?: string;
  icon: string;
  loading?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

const colorMap = {
  primary:   { icon: 'bg-orange-100 text-primary',   border: 'border-l-primary' },
  secondary: { icon: 'bg-teal-100 text-secondary',   border: 'border-l-secondary' },
  success:   { icon: 'bg-green-100 text-success',    border: 'border-l-success' },
  warning:   { icon: 'bg-amber-100 text-warning',    border: 'border-l-warning' },
  danger:    { icon: 'bg-red-100 text-danger',       border: 'border-l-danger' },
};

export function KpiCard({ title, value, delta, unit, icon, loading, color = 'primary' }: KpiCardProps) {
  if (loading) {
    return (
      <div className="card border-l-4 border-l-border">
        <div className="skeleton h-5 w-24 mb-3" />
        <div className="skeleton h-8 w-20 mb-2" />
        <div className="skeleton h-4 w-16" />
      </div>
    );
  }

  const { icon: iconClass, border } = colorMap[color];

  return (
    <div className={clsx('card border-l-4', border)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-text-secondary font-medium">{title}</p>
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', iconClass)}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      <p className="num text-2xl font-bold text-text-primary">
        {unit && unit !== '%' && <span className="text-lg text-text-secondary mr-1">{unit}</span>}
        {value}
        {unit === '%' && <span className="text-lg text-text-secondary">%</span>}
      </p>
      {delta !== undefined && (
        <p className={clsx('text-xs mt-1 flex items-center gap-0.5', delta >= 0 ? 'text-success' : 'text-danger')}>
          <span className="material-symbols-outlined text-[14px]">
            {delta >= 0 ? 'trending_up' : 'trending_down'}
          </span>
          {Math.abs(delta)}% vs yesterday
        </p>
      )}
    </div>
  );
}
