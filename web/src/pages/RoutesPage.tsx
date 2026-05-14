import { useEffect, useState } from 'react';
import { routesService } from '@/services/routes.service';
import { Route, OptimizationResult } from '@/types/route';
import { LiveMap } from '@/components/map/LiveMap';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useModal } from '@/hooks/useModal';
import { useNotification } from '@/context/NotificationContext';
import { clsx } from 'clsx';

const statusColor: Record<string, string> = {
  planned:     'badge-blue',
  in_progress: 'badge-amber',
  completed:   'badge-green',
  cancelled:   'badge-red',
};

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [optimizing, setOptimizing] = useState(false);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const { notify } = useNotification();
  const optModal = useModal<string>(); // payload = routeId

  useEffect(() => {
    setLoading(true);
    routesService.list(selectedDate)
      .then(setRoutes)
      .catch(() => notify('error', 'Failed to load routes'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const handleOptimize = async (routeId: string) => {
    setOptimizing(true);
    try {
      const result = await routesService.optimize(routeId);
      setOptimization(result);
      optModal.open(routeId);
    } catch {
      notify('error', 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyOptimization = async () => {
    if (!optimization || !optModal.payload) return;
    try {
      await routesService.confirm(optModal.payload, { status: 'in_progress' });
      notify('success', 'Optimization applied. Drivers notified.');
      optModal.close();
      setOptimization(null);
      routesService.list(selectedDate).then(setRoutes);
    } catch {
      notify('error', 'Failed to apply optimization');
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await routesService.confirm(id, { status: 'completed' });
      setRoutes((prev) => prev.map((r) => r.id === id ? { ...r, status: 'completed' } : r));
      notify('success', 'Route marked complete');
    } catch {
      notify('error', 'Failed to update route');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Map 60% */}
      <div className="flex-[6] flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-sm text-text-muted">{routes.length} routes</span>
        </div>
        <LiveMap height="100%" className="flex-1" />
      </div>

      {/* Route list 40% */}
      <div className="flex-[4] overflow-y-auto space-y-3">
        <h2 className="text-sm font-semibold text-text-primary sticky top-0 bg-surface-2 py-1 z-10">
          Route List
        </h2>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
          : routes.map((route) => (
              <div key={route.id} className="card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{route.driverName}</p>
                    <p className="text-xs text-text-muted">{route.vehiclePlate}</p>
                  </div>
                  <span className={clsx('badge', statusColor[route.status] ?? 'badge-gray')}>
                    {route.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="num text-sm font-bold text-text-primary">{route.completedStops}/{route.totalStops}</p>
                    <p className="text-[10px] text-text-muted">Stops</p>
                  </div>
                  <div>
                    <p className="num text-sm font-bold text-text-primary">{route.totalDistance.toFixed(1)}</p>
                    <p className="text-[10px] text-text-muted">km</p>
                  </div>
                  <div>
                    <p className="num text-sm font-bold text-text-primary">{Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m</p>
                    <p className="text-[10px] text-text-muted">ETA</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" icon="auto_fix_high" loading={optimizing}
                    onClick={() => handleOptimize(route.id)}>
                    Optimize
                  </Button>
                  {route.status !== 'completed' && (
                    <Button size="sm" variant="ghost" icon="check_circle"
                      onClick={() => handleMarkComplete(route.id)}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
      </div>

      {/* Optimization modal */}
      <Modal
        isOpen={optModal.isOpen}
        onClose={() => { optModal.close(); setOptimization(null); }}
        title="Route Optimization"
        footer={
          <>
            <Button variant="ghost" onClick={() => { optModal.close(); setOptimization(null); }}>Cancel</Button>
            <Button onClick={handleApplyOptimization} icon="check">Apply Optimization</Button>
          </>
        }
      >
        {optimization && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="card border-border bg-surface-3">
                <p className="text-xs text-text-muted mb-2">Current</p>
                <p className="num text-xl font-bold">{optimization.before.totalDistance.toFixed(1)} km</p>
                <p className="text-xs text-text-muted">{Math.floor(optimization.before.estimatedDuration / 60)}h {optimization.before.estimatedDuration % 60}m</p>
              </div>
              <div className="card border-success/30 bg-green-50">
                <p className="text-xs text-success mb-2">Optimized</p>
                <p className="num text-xl font-bold text-success">{optimization.after.totalDistance.toFixed(1)} km</p>
                <p className="text-xs text-success">{Math.floor(optimization.after.estimatedDuration / 60)}h {optimization.after.estimatedDuration % 60}m</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-success text-2xl">trending_down</span>
              <div>
                <p className="text-sm font-semibold text-success">Saves {optimization.savings.percent.toFixed(1)}%</p>
                <p className="text-xs text-text-secondary">{optimization.savings.distance.toFixed(1)} km · {optimization.savings.time} min saved</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
