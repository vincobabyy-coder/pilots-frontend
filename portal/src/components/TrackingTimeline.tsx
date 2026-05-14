import { clsx } from 'clsx';
import { TrackingStatus, TrackingEvent } from '@/types/tracking';

const steps: { key: TrackingStatus; label: string; icon: string }[] = [
  { key: 'created',          label: 'Order Placed',      icon: 'shopping_cart' },
  { key: 'picked',           label: 'Picked & Packed',   icon: 'inventory_2' },
  { key: 'in_transit',       label: 'In Transit',        icon: 'local_shipping' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: 'two_wheeler' },
  { key: 'delivered',        label: 'Delivered',         icon: 'check_circle' },
];

interface Props {
  currentStatus: TrackingStatus;
  events: TrackingEvent[];
}

export function TrackingTimeline({ currentStatus, events }: Props) {
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);

  const eventForStep = (stepKey: TrackingStatus) =>
    events.findLast((e) => e.description.toLowerCase().includes(stepKey.replace(/_/g, ' ')));

  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const future = i > currentIdx;
        const ev = eventForStep(step.key);

        return (
          <div key={step.key} className="flex gap-4">
            {/* Icon column */}
            <div className="flex flex-col items-center">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
                  done && 'bg-green-500',
                  active && 'bg-[#C27550]',
                  future && 'bg-gray-100'
                )}
              >
                {active ? (
                  <div className="relative">
                    <span className="material-symbols-outlined text-white text-[18px]">{step.icon}</span>
                    <span className="absolute inset-0 rounded-full bg-[#C27550] opacity-50 pulse-dot" />
                  </div>
                ) : (
                  <span
                    className={clsx(
                      'material-symbols-outlined text-[18px]',
                      done ? 'text-white' : 'text-gray-400'
                    )}
                  >
                    {done ? 'check' : step.icon}
                  </span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    'w-0.5 flex-1 my-1 min-h-[28px]',
                    done ? 'bg-green-400' : 'bg-gray-200'
                  )}
                />
              )}
            </div>

            {/* Text column */}
            <div className="pb-6 flex-1 min-w-0">
              <p
                className={clsx(
                  'text-sm font-semibold',
                  done && 'text-green-700',
                  active && 'text-[#C27550]',
                  future && 'text-gray-400'
                )}
              >
                {step.label}
              </p>
              {(done || active) && ev && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(ev.timestamp).toLocaleString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {ev.location ? ` · ${ev.location}` : ''}
                </p>
              )}
              {active && (
                <span className="inline-block mt-1 text-[10px] font-medium text-[#C27550] bg-orange-50 px-2 py-0.5 rounded-full">
                  Current step
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
