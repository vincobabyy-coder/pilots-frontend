import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { driversService } from '@/services/drivers.service';
import { Driver, DriverPerformance, DriverDelivery } from '@/types/driver';
import { LiveMap } from '@/components/map/LiveMap';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useModal } from '@/hooks/useModal';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotification } from '@/context/NotificationContext';
import { DriverLocation } from '@/types/driver';

export default function DriverDetailPage() {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [performance, setPerformance] = useState<DriverPerformance | null>(null);
  const [deliveries, setDeliveries] = useState<DriverDelivery[]>([]);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const reassignModal = useModal<DriverDelivery>();

  const loadData = useCallback(() => {
    if (!driverId) return;
    setLoading(true);

    Promise.all([
      driversService.detail(driverId),
      driversService.performance(driverId),
      driversService.deliveries(driverId),
    ])
      .then(([d, p, del]) => {
        setDriver(d);
        setPerformance(p);
        setDeliveries(del);
      })
      .catch(() => notify('error', 'Failed to load driver details'))
      .finally(() => setLoading(false));
  }, [driverId, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time location updates
  useWebSocket<DriverLocation>('driver_location', (loc) => {
    if (loc.driverId === driverId) {
      setDriverLocation(loc);
    }
  });

  const completedDeliveries = deliveries.filter((d) => d.completedAt).length;
  const onTimeDeliveries = deliveries.filter((d) => d.onTime).length;
  const failedDeliveries = deliveries.filter((d) => d.status === 'failed').length;

  const deliveryColumns: Column<DriverDelivery>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      render: (d) => (
        <span className="font-mono text-xs font-medium">{d.trackingNumber}</span>
      ),
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (d) => <span>{d.destination}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (d) => (
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          d.status === 'delivered' ? 'bg-success/10 text-success' :
          d.status === 'in_transit' ? 'bg-info/10 text-info' :
          d.status === 'failed' ? 'bg-danger/10 text-danger' :
          'bg-warning/10 text-warning'
        }`}>
          {d.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'completedAt',
      header: 'Completed',
      render: (d) => (
        <span className="text-xs text-text-muted">
          {d.completedAt ? new Date(d.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
        </span>
      ),
    },
    {
      key: 'onTime',
      header: 'On-Time',
      render: (d) => (
        <span className={d.onTime ? 'text-success text-xs font-medium' : 'text-danger text-xs font-medium'}>
          {d.onTime ? 'Yes' : 'Late'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-32 rounded-xl" />
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-4">Driver not found</p>
        <Button onClick={() => navigate('/drivers')}>Back to Drivers</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {driver.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-text-primary">{driver.name}</h1>
              <Button variant="outline" onClick={() => navigate('/drivers')}>
                Back
              </Button>
            </div>
            <p className="text-text-muted">{driver.email} · {driver.phone}</p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                driver.status === 'active' ? 'bg-success/10 text-success' :
                driver.status === 'offline' ? 'bg-gray-100 text-gray-600' :
                driver.status === 'waiting' ? 'bg-warning/10 text-warning' :
                'bg-secondary/10 text-secondary'
              }`}>
                {driver.status.replace('_', ' ')}
              </span>
              <span className="text-text-secondary">
                {driver.vehicleType} · {driver.vehiclePlate}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px] text-warning">star</span>
                <span className="font-semibold">{driver.rating}/5</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Cards */}
      {performance && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card text-center">
            <p className="text-xs text-text-muted">On-Time %</p>
            <p className="num text-2xl font-bold text-success mt-1">{performance.onTimePercent}%</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-text-muted">Deliveries</p>
            <p className="num text-2xl font-bold text-primary mt-1">{performance.totalDeliveries}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-text-muted">Avg Time</p>
            <p className="num text-2xl font-bold text-text-primary mt-1">{performance.avgDeliveryTime}m</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-text-muted">Distance</p>
            <p className="num text-2xl font-bold text-text-primary mt-1">{performance.totalDistance.toFixed(0)}km</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-text-muted">Earnings</p>
            <p className="num text-2xl font-bold text-warning mt-1">₦{(performance.earnings / 1000).toFixed(0)}k</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-text-muted">Rating</p>
            <p className="num text-2xl font-bold text-secondary mt-1">{performance.rating}/5</p>
          </div>
        </div>
      )}

      {/* Live Map */}
      <div className="card overflow-hidden">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Live Location</h2>
        <LiveMap
          drivers={driverLocation ? [driverLocation] : []}
          height="400px"
        />
        {driverLocation && (
          <div className="mt-3 text-xs text-text-muted">
            Speed: {driverLocation.speed ?? 0}km/h · Last updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Delivery Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card border-l-4 border-l-success">
          <p className="text-xs text-text-muted">Completed</p>
          <p className="num text-2xl font-bold text-success mt-1">{completedDeliveries}</p>
        </div>
        <div className="card border-l-4 border-l-info">
          <p className="text-xs text-text-muted">On-Time</p>
          <p className="num text-2xl font-bold text-info mt-1">{onTimeDeliveries}</p>
        </div>
        <div className="card border-l-4 border-l-danger">
          <p className="text-xs text-text-muted">Failed</p>
          <p className="num text-2xl font-bold text-danger mt-1">{failedDeliveries}</p>
        </div>
      </div>

      {/* Delivery History */}
      <div className="card">
        <h2 className="text-sm font-semibold text-text-primary mb-4">
          Delivery History ({deliveries.length})
        </h2>
        <DataTable
          columns={deliveryColumns}
          data={deliveries}
          loading={false}
          emptyMessage="No delivery history."
        />
      </div>

      {/* Contact Actions */}
      <div className="flex gap-3">
        <a href={`tel:${driver.phone}`}>
          <Button size="lg" icon="call" variant="outline">
            Call Driver
          </Button>
        </a>
        <Button size="lg" icon="message" variant="outline">
          Send Message
        </Button>
        <Button size="lg" icon="edit" variant="outline">
          Edit Profile
        </Button>
      </div>

      {/* Reassign Modal */}
      <Modal
        isOpen={reassignModal.isOpen}
        onClose={reassignModal.close}
        title="Reassign Delivery"
        size="md"
      >
        {reassignModal.payload && (
          <div className="space-y-4">
            <div className="bg-surface-2 rounded-lg p-3">
              <p className="text-xs text-text-muted">Tracking #</p>
              <p className="font-mono font-semibold">{reassignModal.payload.trackingNumber}</p>
            </div>
            <p className="text-sm text-text-secondary">
              Reassigning this delivery to another driver will be processed immediately.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={reassignModal.close}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  reassignModal.close();
                  notify('success', 'Delivery reassignment request submitted');
                }}
              >
                Confirm Reassignment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
