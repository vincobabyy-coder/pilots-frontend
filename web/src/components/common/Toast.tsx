import { useNotification } from '@/context/NotificationContext';
import { clsx } from 'clsx';

const typeConfig = {
  success: { icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  error:   { icon: 'error',        color: 'text-red-600',   bg: 'bg-red-50 border-red-200' },
  warning: { icon: 'warning',      color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  info:    { icon: 'info',         color: 'text-blue-600',  bg: 'bg-blue-50 border-blue-200' },
};

export function ToastContainer() {
  const { toasts, dismiss } = useNotification();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((toast) => {
        const cfg = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={clsx(
              'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-card toast-in',
              cfg.bg
            )}
          >
            <span className={clsx('material-symbols-outlined text-[20px] shrink-0 mt-0.5', cfg.color)}>
              {cfg.icon}
            </span>
            <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-text-muted hover:text-text-primary shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
