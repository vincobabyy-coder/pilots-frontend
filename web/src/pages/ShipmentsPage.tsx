import { useEffect, useState } from 'react';
import { shipmentsService } from '@/services/shipments.service';
import { Shipment, ShipmentStatus, ShipmentEvent } from '@/types/shipment';
import { DataTable, Column } from '@/components/tables/DataTable';
import { shipmentStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useModal } from '@/hooks/useModal';
import { LiveMap } from '@/components/map/LiveMap';
import { useNotification } from '@/context/NotificationContext';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<(Shipment & { events: ShipmentEvent[] }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailModal = useModal<Shipment>();
  const { notify } = useNotification();

  const loadShipments = () => {
    setLoading(true);
    shipmentsService
      .list({ status: statusFilter || undefined, search: search || undefined, limit: 200 })
      .then((r) => setShipments(r.data))
      .catch(() => notify('error', 'Failed to load shipments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadShipments(); }, [statusFilter]);

  const openDetail = async (s: Shipment) => {
    detailModal.open(s);
    setDetailLoading(true);
    try {
      const d = await shipmentsService.detail(s.id);
      setDetail(d);
    } catch {
      notify('error', 'Failed to load shipment detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: Column<Shipment>[] = [
    { key: 'trackingNumber', header: 'Tracking #', sortable: true,
      render: (s) => <span className="font-mono text-xs font-medium">{s.trackingNumber}</span> },
    { key: 'destination', header: 'Destination', render: (s) => s.destination.city },
    { key: 'status', header: 'Status', render: (s) => shipmentStatusBadge(s.status) },
    { key: 'priority', header: 'Priority',
      render: (s) => <span className={`text-xs capitalize ${s.priority === 'urgent' ? 'text-danger' : 'text-text-secondary'}`}>{s.priority}</span> },
    { key: 'driverName', header: 'Driver', render: (s) => s.driverName ?? '—' },
    { key: 'eta', header: 'ETA',
      render: (s) => s.eta ? new Date(s.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' },
    { key: 'distance', header: 'Distance', render: (s) => s.distance ? `${s.distance.toFixed(1)} km` : '—' },
    { key: 'lastEvent', header: 'Last Event', render: (s) => s.lastEvent?.description ?? '—' },
  ];

  const statusSteps: ShipmentStatus[] = ['created', 'picked', 'in_transit', 'out_for_delivery', 'delivered'];

  return (
    <div className="space-y-4">
      {/* Search + filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[18px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadShipments()}
            placeholder="Search tracking number..."
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | '')}
          className="h-10 px-3 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {statusSteps.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <Button size="sm" variant="outline" icon="search" onClick={loadShipments}>Search</Button>

        {/* View toggle */}
        <div className="ml-auto flex gap-1 bg-surface-3 rounded-lg p-1">
          {(['list', 'map'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                view === v ? 'bg-white shadow text-text-primary' : 'text-text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{v === 'list' ? 'list' : 'map'}</span>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' && (
        <DataTable
          columns={columns}
          data={shipments}
          loading={loading}
          onRowClick={openDetail}
          emptyMessage="No shipments found."
        />
      )}

      {view === 'map' && (
        <LiveMap shipments={shipments} height="600px" />
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.isOpen}
        onClose={detailModal.close}
        title={`Shipment — ${detailModal.payload?.trackingNumber ?? ''}`}
        size="lg"
      >
        {detailLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-lg" />)}
          </div>
        ) : detail && (
          <div className="space-y-5">
            {/* Status timeline */}
            <div>
              <p className="text-xs font-semibold text-text-muted uppercase mb-3">Status Timeline</p>
              <div className="flex items-center gap-0">
                {statusSteps.map((step, i) => {
                  const idx = statusSteps.indexOf(detail.status);
                  const done = i <= idx;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] ${done ? 'bg-success' : 'bg-surface-3'}`}>
                        {done ? <span className="material-symbols-outlined text-[14px]">check</span> : i + 1}
                      </div>
                      <p className="text-[9px] text-text-muted text-center capitalize">{step.replace(/_/g, ' ')}</p>
                      {i < statusSteps.length - 1 && (
                        <div className={`absolute h-0.5 w-full top-3 left-1/2 ${done ? 'bg-success' : 'bg-surface-3'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-text-muted text-xs">Destination</p><p className="font-medium">{detail.destination.city}, {detail.destination.state}</p></div>
              <div><p className="text-text-muted text-xs">Driver</p><p className="font-medium">{detail.driverName ?? 'Unassigned'}</p></div>
              <div><p className="text-text-muted text-xs">ETA</p><p className="num font-medium">{detail.eta ? new Date(detail.eta).toLocaleString() : '—'}</p></div>
              <div><p className="text-text-muted text-xs">Distance</p><p className="num font-medium">{detail.distance?.toFixed(1) ?? '—'} km</p></div>
            </div>

            {/* Event log */}
            {detail.events.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase mb-2">Event Log</p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {detail.events.map((ev) => (
                    <div key={ev.id} className="flex gap-3 text-sm">
                      <span className="num text-[10px] text-text-muted shrink-0 pt-0.5">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                      <p className="text-text-primary">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
