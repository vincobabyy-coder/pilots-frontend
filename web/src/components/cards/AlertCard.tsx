import { clsx } from 'clsx';
import { AlertItem } from '@/types/analytics';
import { Button } from '@/components/common/Button';

interface AlertCardProps {
  alert: AlertItem;
  onDismiss: (id: string) => void;
  onAcknowledge?: (id: string) => void;
  onAction?: (id: string) => void;
}

const severityConfig = {
  info:     { bg: 'bg-blue-50 border-blue-200',   icon: 'info',    iconColor: 'text-blue-500' },
  warning:  { bg: 'bg-amber-50 border-amber-200', icon: 'warning', iconColor: 'text-warning' },
  critical: { bg: 'bg-red-50 border-red-200',     icon: 'error',   iconColor: 'text-danger' },
};

export function AlertCard({ alert, onDismiss, onAcknowledge, onAction }: AlertCardProps) {
  const cfg = severityConfig[alert.severity];

  return (
    <div className={clsx('rounded-xl border p-4 flex gap-3', cfg.bg)}>
      <span className={clsx('material-symbols-outlined text-[22px] shrink-0 mt-0.5', cfg.iconColor)}>
        {cfg.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{alert.description}</p>
          </div>
          {alert.acknowledged && (
            <span className="text-xs font-medium text-success">Acknowledged</span>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          {onAction && (
            <Button size="sm" variant="outline" onClick={() => onAction(alert.id)}>
              View
            </Button>
          )}
          {!alert.acknowledged && onAcknowledge && (
            <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)}>
              Acknowledge
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onDismiss(alert.id)}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
