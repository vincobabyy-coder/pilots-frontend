import { clsx } from 'clsx';
import { ShipmentStatus } from '@/types/shipment';
import { OrderStatus } from '@/types/order';
import { DriverStatus } from '@/types/driver';

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-600',
  primary: 'bg-orange-100 text-orange-800',
};

const dotClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
  primary: 'bg-primary',
};

export function Badge({ variant = 'gray', children, dot, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotClasses[variant])} />
      )}
      {children}
    </span>
  );
}

export function shipmentStatusBadge(status: ShipmentStatus) {
  const map: Record<ShipmentStatus, { variant: BadgeVariant; label: string }> = {
    created:          { variant: 'blue',    label: 'Created' },
    picked:           { variant: 'primary', label: 'Picked' },
    in_transit:       { variant: 'amber',   label: 'In Transit' },
    out_for_delivery: { variant: 'amber',   label: 'Out for Delivery' },
    delivered:        { variant: 'green',   label: 'Delivered' },
    failed:           { variant: 'red',     label: 'Failed' },
    returned:         { variant: 'red',     label: 'Returned' },
  };
  const { variant, label } = map[status] ?? { variant: 'gray', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function orderStatusBadge(status: OrderStatus) {
  const map: Record<OrderStatus, { variant: BadgeVariant; label: string }> = {
    created:    { variant: 'blue',    label: 'Created' },
    allocated:  { variant: 'primary', label: 'Allocated' },
    picked:     { variant: 'amber',   label: 'Picked' },
    in_transit: { variant: 'amber',   label: 'In Transit' },
    delivered:  { variant: 'green',   label: 'Delivered' },
    cancelled:  { variant: 'red',     label: 'Cancelled' },
  };
  const { variant, label } = map[status] ?? { variant: 'gray', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}

export function driverStatusBadge(status: DriverStatus) {
  const map: Record<DriverStatus, { variant: BadgeVariant; label: string }> = {
    active:   { variant: 'green', label: 'Active' },
    offline:  { variant: 'gray',  label: 'Offline' },
    waiting:  { variant: 'amber', label: 'Waiting' },
    on_break: { variant: 'blue',  label: 'On Break' },
  };
  const { variant, label } = map[status] ?? { variant: 'gray', label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}
