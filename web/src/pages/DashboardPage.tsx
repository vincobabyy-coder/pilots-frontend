import { useEffect, useState, useCallback } from 'react';
import { KpiCard } from '@/components/cards/KpiCard';
import { AlertCard } from '@/components/cards/AlertCard';
import { LiveMap } from '@/components/map/LiveMap';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { DataTable, Column } from '@/components/tables/DataTable';
import { shipmentStatusBadge } from '@/components/common/Badge';
import { analyticsService } from '@/services/analytics.service';
import { shipmentsService } from '@/services/shipments.service';
import { driversService } from '@/services/drivers.service';
import { warehousesService } from '@/services/warehouses.service';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotification } from '@/context/NotificationContext';
import { KpiData, ForecastPoint, TimeseriesPoint, AlertItem } from '@/types/analytics';
import { Shipment } from '@/types/shipment';
import { DriverLocation } from '@/types/driver';
import { Warehouse } from '@/services/warehouses.service';
import { Button } from '@/components/common/Button';

export default function DashboardPage() {
  const { notify } = useNotification();

  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [forecasts, setForecasts] = useState<ForecastPoint[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    Promise.all([
      analyticsService.kpis(),
      analyticsService.forecasts(),
      analyticsService.timeseries(),
      analyticsService.anomalies(),
      shipmentsService.list({ limit: 20 }),
      driversService.locations(),
      warehousesService.list(),
    ])
      .then(([k, f, t, a, s, dl, wh]) => {
        setKpis(k);
        setForecasts(f);
        setTimeseries(t);
        setAlerts(a);
        setShipments(s.data);
        setDriverLocations(dl);
        setWarehouses(wh);
      })
      .catch(() => notify('error', 'Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, [notify]);

  // Live KPI updates
  useWebSocket<KpiData>('eta_update', (data) => {
    setKpis(data);
  });

  // Live shipment row flash
  useWebSocket<{ id: string; status: string }>('shipment_status', ({ id }) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === id ? { ...s } : s))
    );
    setHighlightedRow(id);
    setTimeout(() => setHighlightedRow(null), 3000);
  });

  // Live alert push
  useWebSocket<AlertItem>('alert_new', (alert) => {
    setAlerts((prev) => [alert, ...prev]);
    notify('warning', alert.title);
  });

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const shipmentColumns: Column<Shipment>[] = [
    {
      key: 'trackingNumber',
      header: 'Tracking #',
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-medium text-text-primary">{s.trackingNumber}</span>,
    },
    {
      key: 'destination',
      header: 'Destination',
      render: (s) => s.destination.city,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => shipmentStatusBadge(s.status),
    },
    {
      key: 'driverName',
      header: 'Driver',
      render: (s) => s.driverName ?? '—',
    },
    {
      key: 'eta',
      header: 'ETA',
      render: (s) =>
        s.eta ? (
          <span className="num text-sm">{new Date(s.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        ) : (
          '—'
        ),
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (s) => s.distance ? `${s.distance.toFixed(1)} km` : '—',
    },
  ];

  const handleRefresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      analyticsService.kpis(),
      analyticsService.forecasts(),
      analyticsService.timeseries(),
      analyticsService.anomalies(),
      shipmentsService.list({ limit: 20, warehouseId: selectedWarehouse || undefined }),
      driversService.locations(),
      warehousesService.list(),
    ])
      .then(([k, f, t, a, s, dl, wh]) => {
        setKpis(k);
        setForecasts(f);
        setTimeseries(t);
        setAlerts(a);
        setShipments(s.data);
        setDriverLocations(dl);
        setWarehouses(wh);
      })
      .catch(() => notify('error', 'Failed to refresh dashboard data'))
      .finally(() => setLoading(false));
  }, [selectedWarehouse, notify]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month')}
            className="h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <Button size="sm" variant="outline" icon="refresh" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Deliveries"
          value={kpis?.activeDeliveries ?? 0}
          delta={kpis?.activeDeliveriesDelta}
          icon="local_shipping"
          color="primary"
          loading={loading}
        />
        <KpiCard
          title="On-Time Rate"
          value={kpis?.onTimePercent ?? 0}
          delta={kpis?.onTimeDelta}
          unit="%"
          icon="schedule"
          color="success"
          loading={loading}
        />
        <KpiCard
          title="Fleet Utilization"
          value={kpis?.fleetUtilization ?? 0}
          delta={kpis?.fleetUtilizationDelta}
          unit="%"
          icon="directions_car"
          color="secondary"
          loading={loading}
        />
        <KpiCard
          title="Revenue Today"
          value={kpis ? `${(kpis.revenueToday / 1000).toFixed(1)}k` : '—'}
          delta={kpis?.revenueDelta}
          unit="₦"
          icon="payments"
          color="warning"
          loading={loading}
        />
      </div>

      {/* Map */}
      <LiveMap
        drivers={driverLocations}
        warehouses={warehouses}
        shipments={shipments}
        height="450px"
      />

      {/* Shipment Board + Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">Active Shipments</h2>
            <span className="text-xs text-text-muted">{shipments.length} shipments</span>
          </div>
          <DataTable
            columns={shipmentColumns}
            data={shipments}
            loading={loading}
            rowClassName={(row) => (row.id === highlightedRow ? 'row-flash' : '')}
            emptyMessage="No active shipments."
          />
        </div>

        {/* Exceptions Panel */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Exceptions
            {alerts.length > 0 && (
              <span className="ml-2 text-xs text-white bg-danger rounded-full px-1.5 py-0.5">
                {alerts.length}
              </span>
            )}
          </h2>
          <div className="space-y-2">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))
              : alerts.slice(0, 8).map((a) => (
                  <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} />
                ))}
            {!loading && alerts.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">
                <span className="material-symbols-outlined text-3xl block mb-1">check_circle</span>
                No exceptions right now
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart data={forecasts} title="Demand Forecast (14-day)" />
        <BarChart data={timeseries} title="Performance by Hour" />
      </div>
    </div>
  );
}
