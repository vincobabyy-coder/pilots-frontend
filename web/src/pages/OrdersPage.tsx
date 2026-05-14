import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ordersService } from '@/services/orders.service';
import { Order, CreateOrderPayload, OrderStatus } from '@/types/order';
import { DataTable, Column } from '@/components/tables/DataTable';
import { orderStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useNotification } from '@/context/NotificationContext';

const orderSchema = z.object({
  customer: z.string().min(2, 'Customer name required'),
  street: z.string().min(3, 'Street required'),
  city: z.string().min(2, 'City required'),
  state: z.string().min(2, 'State required'),
  country: z.string().default('Nigeria'),
  sku: z.string().min(1, 'SKU required'),
  quantity: z.coerce.number().int().positive('Must be positive'),
  warehouseId: z.string().min(1, 'Warehouse required'),
  priority: z.enum(['standard', 'express', 'urgent']),
  notes: z.string().optional(),
});

type OrderForm = z.infer<typeof orderSchema>;

export default function OrdersPage() {
  const [tab, setTab] = useState<'create' | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const { notify } = useNotification();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: { priority: 'standard', country: 'Nigeria' },
  });

  const loadOrders = () => {
    setLoading(true);
    ordersService
      .list({ status: statusFilter || undefined, limit: 200 })
      .then((r) => setOrders(r.data))
      .catch(() => notify('error', 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const onCreateSubmit = async (data: OrderForm) => {
    setCreating(true);
    try {
      const payload: CreateOrderPayload = {
        customer: data.customer,
        destination: { street: data.street, city: data.city, state: data.state, country: data.country },
        sku: data.sku,
        quantity: data.quantity,
        warehouseId: data.warehouseId,
        priority: data.priority,
        notes: data.notes,
      };
      await ordersService.create(payload);
      notify('success', 'Order created successfully');
      reset();
      setTab('all');
      loadOrders();
    } catch {
      notify('error', 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  const onBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await ordersService.bulk(file);
      notify('success', `Imported ${result.created} orders`);
      loadOrders();
    } catch {
      notify('error', 'Bulk import failed');
    }
    e.target.value = '';
  };

  const columns: Column<Order>[] = [
    { key: 'orderNumber', header: 'Order ID', sortable: true,
      render: (o) => <span className="font-mono text-xs font-medium">{o.orderNumber}</span> },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'destination', header: 'Destination',
      render: (o) => `${o.destination.city}, ${o.destination.state}` },
    { key: 'status', header: 'Status', render: (o) => orderStatusBadge(o.status) },
    { key: 'warehouseName', header: 'Warehouse' },
    { key: 'priority', header: 'Priority',
      render: (o) => (
        <span className={`text-xs font-medium capitalize ${o.priority === 'urgent' ? 'text-danger' : o.priority === 'express' ? 'text-warning' : 'text-text-secondary'}`}>
          {o.priority}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Created', sortable: true,
      render: (o) => new Date(o.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-surface-3 rounded-xl p-1 w-fit">
        {(['all', 'create'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'bg-white shadow-card text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t === 'all' ? 'All Orders' : 'Create New'}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
              className="h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              {(['created','allocated','picked','in_transit','delivered','cancelled'] as const).map((s) => (
                <option key={s} value={s} className="capitalize">{s.replace('_', ' ')}</option>
              ))}
            </select>
            <Button size="sm" variant="outline" icon="refresh" onClick={loadOrders}>
              Refresh
            </Button>
            <div className="ml-auto flex gap-2">
              <input ref={fileRef} type="file" accept=".csv" onChange={onBulkImport} className="hidden" />
              <Button size="sm" variant="outline" icon="upload_file" onClick={() => fileRef.current?.click()}>
                Import CSV
              </Button>
            </div>
          </div>
          <DataTable columns={columns} data={orders} loading={loading} emptyMessage="No orders found." />
        </div>
      )}

      {tab === 'create' && (
        <div className="card max-w-2xl">
          <h2 className="text-base font-semibold text-text-primary mb-5">New Order</h2>
          <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Customer Name" required error={errors.customer?.message} {...register('customer')} />
              <div>
                <label className="text-sm font-medium text-text-primary">Priority <span className="text-danger">*</span></label>
                <select {...register('priority')} className="mt-1 w-full h-10 px-3 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="SKU" required error={errors.sku?.message} {...register('sku')} />
              <Input label="Quantity" type="number" required error={errors.quantity?.message} {...register('quantity')} />
            </div>
            <Input label="Street Address" required error={errors.street?.message} {...register('street')} />
            <div className="grid grid-cols-3 gap-4">
              <Input label="City" required error={errors.city?.message} {...register('city')} />
              <Input label="State" required error={errors.state?.message} {...register('state')} />
              <Input label="Country" {...register('country')} />
            </div>
            <Input label="Warehouse ID" required error={errors.warehouseId?.message} {...register('warehouseId')} />
            <div>
              <label className="text-sm font-medium text-text-primary">Notes</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Optional delivery notes..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={creating} icon="add_circle">Create Order</Button>
              <Button type="button" variant="ghost" onClick={() => setTab('all')}>Cancel</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
