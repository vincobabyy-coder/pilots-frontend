import { useEffect, useState } from 'react';
import { warehousesService, Warehouse, InventoryItem } from '@/services/warehouses.service';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { Button } from '@/components/common/Button';
import { useNotification } from '@/context/NotificationContext';
import { clsx } from 'clsx';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selected, setSelected] = useState<Warehouse | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [invLoading, setInvLoading] = useState(false);
  const { notify } = useNotification();

  useEffect(() => {
    warehousesService
      .list()
      .then((whs) => {
        setWarehouses(whs);
        if (whs.length > 0) setSelected(whs[0]);
      })
      .catch(() => notify('error', 'Failed to load warehouses'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setInvLoading(true);
    warehousesService
      .inventory(selected.id)
      .then(setInventory)
      .catch(() => notify('error', 'Failed to load inventory'))
      .finally(() => setInvLoading(false));
  }, [selected]);

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-36 rounded-xl" />
            ))
          : warehouses.map((wh) => (
              <button
                key={wh.id}
                onClick={() => setSelected(wh)}
                className={clsx(
                  'card text-left hover:shadow-card-hover transition-shadow',
                  selected?.id === wh.id && 'border-primary ring-1 ring-primary'
                )}
              >
                <p className="font-semibold text-sm text-text-primary">{wh.name}</p>
                <p className="text-xs text-text-muted mb-3">{wh.city}</p>
                <GaugeChart
                  value={wh.utilizationPercent}
                  label="Utilization"
                  size={100}
                  color={
                    wh.utilizationPercent > 85
                      ? '#EF5350'
                      : wh.utilizationPercent > 70
                      ? '#FFA726'
                      : '#4CAF50'
                  }
                />
              </button>
            ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {!selected ? (
          <p className="text-text-muted text-sm">Select a warehouse</p>
        ) : (
          <>
            {/* Header card */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{selected.name}</h2>
                  <p className="text-sm text-text-muted">
                    {selected.address}, {selected.city}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon="swap_horiz"
                  onClick={() => notify('info', 'Rebalance flow coming soon')}
                >
                  Rebalance
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="num text-2xl font-bold text-text-primary">
                    {selected.currentStock.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Current Stock</p>
                </div>
                <div>
                  <p className="num text-2xl font-bold text-text-primary">
                    {selected.capacity.toLocaleString()}
                  </p>
                  <p className="text-xs text-text-muted">Capacity</p>
                </div>
                <div>
                  <p className="num text-2xl font-bold text-text-primary">{selected.staffCount}</p>
                  <p className="text-xs text-text-muted">Staff</p>
                </div>
              </div>
            </div>

            {/* Inventory table */}
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">Inventory</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-3 border-b border-border">
                    <tr>
                      {['SKU', 'Name', 'In Stock', 'Reserved', 'Available', 'Reorder Level'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase tracking-wide"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invLoading
                      ? Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 6 }).map((_, j) => (
                              <td key={j} className="px-4 py-3">
                                <div className="skeleton h-4 rounded" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : inventory.map((item) => (
                          <tr key={item.sku} className={item.isLowStock ? 'bg-red-50' : ''}>
                            <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                            <td className="px-4 py-3">{item.name}</td>
                            <td
                              className={clsx(
                                'px-4 py-3 num',
                                item.isLowStock && 'text-danger font-semibold'
                              )}
                            >
                              {item.currentStock}
                            </td>
                            <td className="px-4 py-3 num">{item.reserved}</td>
                            <td className="px-4 py-3 num">{item.available}</td>
                            <td className="px-4 py-3 num text-text-muted">{item.reorderLevel}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
