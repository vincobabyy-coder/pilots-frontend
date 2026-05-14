import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driversService } from '@/services/drivers.service';
import { Driver, DriverPerformance } from '@/types/driver';
import { driverStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useModal } from '@/hooks/useModal';
import { useNotification } from '@/context/NotificationContext';
import { clsx } from 'clsx';

export default function DriversPage() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState<DriverPerformance | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const modal = useModal<Driver>();
  const { notify } = useNotification();

  useEffect(() => {
    driversService
      .roster()
      .then(setDrivers)
      .catch(() => notify('error', 'Failed to load drivers'))
      .finally(() => setLoading(false));
  }, []);

  const openDriver = async (driver: Driver) => {
    modal.open(driver);
    setPerformance(null);
    setPerfLoading(true);
    try {
      const perf = await driversService.performance(driver.id);
      setPerformance(perf);
    } catch {
      // performance stats not critical
    } finally {
      setPerfLoading(false);
    }
  };

  const statusBorder: Record<Driver['status'], string> = {
    active: 'border-l-success',
    offline: 'border-l-gray-300',
    waiting: 'border-l-warning',
    on_break: 'border-l-secondary',
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{drivers.length} drivers</p>
        <div className="flex gap-1 bg-surface-3 rounded-lg p-1">
          {(['grid', 'list'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === v ? 'bg-white shadow text-text-primary' : 'text-text-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {v === 'grid' ? 'grid_view' : 'list'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <div
          className={clsx(
            viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'flex flex-col gap-2'
          )}
        >
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className={clsx(
                'card border-l-4 cursor-pointer hover:shadow-card-hover transition-shadow',
                statusBorder[driver.status],
                viewMode === 'list' && 'flex items-center gap-4 py-3'
              )}
              onClick={() => openDriver(driver)}
            >
              <div
                className={clsx(
                  'bg-secondary rounded-full flex items-center justify-center text-white font-semibold shrink-0',
                  viewMode === 'grid' ? 'w-12 h-12 text-lg mb-3' : 'w-10 h-10 text-sm'
                )}
              >
                {driver.name.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm truncate">{driver.name}</p>
                <div className="mt-1">{driverStatusBadge(driver.status)}</div>

                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 gap-1 mt-3 text-center">
                    <div>
                      <p className="num text-sm font-bold text-text-primary">
                        {driver.currentDeliveries}
                      </p>
                      <p className="text-[10px] text-text-muted">Active</p>
                    </div>
                    <div>
                      <p className="num text-sm font-bold text-text-primary">
                        {driver.onTimePercent}%
                      </p>
                      <p className="text-[10px] text-text-muted">On-time</p>
                    </div>
                  </div>
                )}
              </div>

              {viewMode === 'list' && (
                <div className="flex items-center gap-6 text-sm ml-auto">
                  <div className="text-center">
                    <p className="num font-bold">{driver.currentDeliveries}</p>
                    <p className="text-[10px] text-text-muted">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="num font-bold">{driver.onTimePercent}%</p>
                    <p className="text-[10px] text-text-muted">On-time</p>
                  </div>
                  <span className="material-symbols-outlined text-text-muted text-[18px]">
                    chevron_right
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={modal.payload?.name ?? 'Driver Detail'}
        size="lg"
      >
        {modal.payload && (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {modal.payload.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary text-lg">{modal.payload.name}</p>
                <p className="text-sm text-text-muted">{modal.payload.email}</p>
                <p className="text-sm text-text-muted">{modal.payload.phone}</p>
                <div className="mt-2 flex items-center gap-2">
                  {driverStatusBadge(modal.payload.status)}
                  <span className="text-xs text-text-muted">
                    {modal.payload.vehicleType} · {modal.payload.vehiclePlate}
                  </span>
                </div>
              </div>
            </div>

            {perfLoading ? (
              <div className="skeleton h-24 rounded-xl" />
            ) : performance ? (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'On-Time', value: `${performance.onTimePercent}%` },
                  { label: 'Deliveries', value: performance.totalDeliveries },
                  { label: 'Rating', value: `${performance.rating}/5` },
                  { label: 'Avg Time', value: `${performance.avgDeliveryTime}min` },
                  { label: 'Distance', value: `${performance.totalDistance.toFixed(0)}km` },
                  { label: 'Earnings', value: `₦${(performance.earnings / 1000).toFixed(0)}k` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-2 rounded-xl p-3 text-center">
                    <p className="num text-lg font-bold text-text-primary">{value}</p>
                    <p className="text-xs text-text-muted">{label}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="primary"
                icon="open_in_new"
                onClick={() => {
                  modal.close();
                  navigate(`/drivers/${modal.payload!.id}`);
                }}
              >
                View Details
              </Button>
              <a href={`tel:${modal.payload.phone}`}>
                <Button size="sm" variant="outline" icon="call">
                  Call
                </Button>
              </a>
              <Button size="sm" variant="ghost" icon="message">
                Message
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
