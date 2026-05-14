import { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analytics.service';
import {
  KpiData,
  ForecastPoint,
  TimeseriesPoint,
  AnomalyMatrix,
  DriverLeaderboardEntry,
  TimeRange,
} from '@/types/analytics';
import { KpiCard } from '@/components/cards/KpiCard';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import { Button } from '@/components/common/Button';
import { useNotification } from '@/context/NotificationContext';

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>('today');
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [forecasts, setForecasts] = useState<ForecastPoint[]>([]);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyMatrix>({
    warehouses: [],
    metrics: [],
    cells: [],
  });
  const [leaderboard, setLeaderboard] = useState<DriverLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { notify } = useNotification();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      analyticsService.kpis(),
      analyticsService.forecasts(range),
      analyticsService.timeseries(range),
      analyticsService.anomalyMatrix(),
      analyticsService.leaderboard(),
    ])
      .then(([k, f, t, a, l]) => {
        setKpis(k);
        setForecasts(f);
        setTimeseries(t);
        setAnomalies(a);
        setLeaderboard(l);
      })
      .catch(() => notify('error', 'Failed to load analytics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [range]);

  const exportCSV = () => {
    if (!leaderboard.length) return;
    const header = 'Rank,Driver,On-Time %,Deliveries,Rating';
    const rows = leaderboard.map(
      (d) => `${d.rank},${d.driverName},${d.onTimePercent},${d.deliveries},${d.rating}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pilots-analytics-${range}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ranges: { value: TimeRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <div className="space-y-6">
      {/* Range selector + Export */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-surface-3 rounded-xl p-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                range === r.value
                  ? 'bg-white shadow text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" icon="download" onClick={exportCSV}>
          Export CSV
        </Button>
      </div>

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          title="On-Time Rate"
          value={kpis?.onTimePercent ?? 0}
          unit="%"
          icon="schedule"
          color="success"
          loading={loading}
        />
        <KpiCard
          title="Avg Del Time"
          value={kpis?.avgDeliveryTime ?? 0}
          unit="m"
          icon="timer"
          color="secondary"
          loading={loading}
        />
        <KpiCard
          title="Distance"
          value={kpis ? `${(kpis.totalDistance / 1000).toFixed(1)}k` : '—'}
          icon="route"
          color="primary"
          loading={loading}
        />
        <KpiCard
          title="Deliveries"
          value={kpis?.totalDeliveries ?? 0}
          icon="local_shipping"
          color="secondary"
          loading={loading}
        />
        <KpiCard
          title="Fraud Alerts"
          value={kpis?.fraudAlerts ?? 0}
          icon="security"
          color="danger"
          loading={loading}
        />
        <KpiCard
          title="Revenue"
          value={kpis ? `${(kpis.revenueToday / 1000).toFixed(1)}k` : '—'}
          unit="₦"
          icon="payments"
          color="warning"
          loading={loading}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart data={forecasts} title="Demand Forecast (14-day)" />
        <BarChart data={timeseries} title="Performance by Hour" />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center justify-center py-6">
          <p className="text-sm font-semibold text-text-primary mb-4">Fleet Utilization</p>
          <GaugeChart
            value={kpis?.fleetUtilization ?? 0}
            label="utilization"
            color="#4A7C8C"
            size={200}
          />
        </div>
        <div className="lg:col-span-2">
          <HeatmapChart data={anomalies} title="Anomaly Heatmap (Warehouse × Metric)" />
        </div>
      </div>

      {/* Driver leaderboard */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">Driver Leaderboard — Top 10</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-surface-3 border-b border-border">
            <tr>
              {['Rank', 'Driver', 'On-Time %', 'Deliveries', 'Rating'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-medium text-text-muted uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : leaderboard.slice(0, 10).map((d) => (
                  <tr key={d.driverId} className="hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <span
                        className={`num font-bold ${
                          d.rank <= 3 ? 'text-primary' : 'text-text-muted'
                        }`}
                      >
                        #{d.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{d.driverName}</td>
                    <td className="px-4 py-3 num">{d.onTimePercent}%</td>
                    <td className="px-4 py-3 num">{d.deliveries}</td>
                    <td className="px-4 py-3 num">{d.rating}/5</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
