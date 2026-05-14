import { useEffect, useState, useCallback } from 'react';
import { analyticsService } from '@/services/analytics.service';
import { AlertItem } from '@/types/analytics';
import { Button } from '@/components/common/Button';
import { AlertCard } from '@/components/cards/AlertCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotification } from '@/context/NotificationContext';

type AlertFilter = 'all' | 'info' | 'warning' | 'critical' | 'acknowledged' | 'pending';

export default function AlertsPage() {
  const { notify } = useNotification();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<AlertFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadAlerts = useCallback(() => {
    setLoading(true);
    analyticsService
      .anomalies()
      .then((data) => setAlerts(data))
      .catch(() => notify('error', 'Failed to load alerts'))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Real-time alert push
  useWebSocket<AlertItem>('alert_new', (alert) => {
    setAlerts((prev) => [alert, ...prev]);
    notify('warning', alert.title);
  });

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      )
    );
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    if (filterType === 'acknowledged') return alert.acknowledged;
    if (filterType === 'pending') return !alert.acknowledged;
    if (filterType !== 'all' && alert.severity !== filterType) return false;
    if (searchQuery && !alert.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !alert.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const alertSummary = {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === 'critical' && !a.acknowledged).length,
    warning: alerts.filter((a) => a.severity === 'warning' && !a.acknowledged).length,
    unacknowledged: alerts.filter((a) => !a.acknowledged).length,
  };

  const columns: Column<AlertItem>[] = [
    {
      key: 'severity',
      header: 'Severity',
      render: (a) => (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          a.severity === 'critical' ? 'bg-danger/10 text-danger' :
          a.severity === 'warning' ? 'bg-warning/10 text-warning' :
          'bg-info/10 text-info'
        }`}>
          {a.severity.charAt(0).toUpperCase() + a.severity.slice(1)}
        </span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (a) => (
        <div>
          <p className="font-medium text-text-primary">{a.title}</p>
          <p className="text-xs text-text-muted mt-1">{a.description}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (a) => (
        <span className="text-xs text-text-secondary capitalize">
          {a.type.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Time',
      render: (a) => (
        <span className="text-xs text-text-muted">
          {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'acknowledged',
      header: 'Status',
      render: (a) => (
        <span className={`text-xs px-2 py-1 rounded-full ${
          a.acknowledged ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
        }`}>
          {a.acknowledged ? 'Acknowledged' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (a) => (
        <div className="flex gap-2">
          {!a.acknowledged && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => acknowledgeAlert(a.id)}
            >
              Ack
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dismissAlert(a.id)}
          >
            Dismiss
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs text-text-muted">Total Alerts</p>
          <p className="num text-2xl font-bold text-text-primary">{alertSummary.total}</p>
        </div>
        <div className="card border-l-4 border-l-danger">
          <p className="text-xs text-text-muted">Critical</p>
          <p className="num text-2xl font-bold text-danger">{alertSummary.critical}</p>
        </div>
        <div className="card border-l-4 border-l-warning">
          <p className="text-xs text-text-muted">Warnings</p>
          <p className="num text-2xl font-bold text-warning">{alertSummary.warning}</p>
        </div>
        <div className="card border-l-4 border-l-primary">
          <p className="text-xs text-text-muted">Unacknowledged</p>
          <p className="num text-2xl font-bold text-primary">{alertSummary.unacknowledged}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'critical', 'warning', 'info', 'pending', 'acknowledged'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filterType === f
                    ? 'bg-primary text-white'
                    : 'bg-surface-3 text-text-secondary hover:text-text-primary'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-1 bg-surface-3 rounded-lg p-1">
              {(['cards', 'table'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === v ? 'bg-white shadow text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" icon="refresh" onClick={loadAlerts}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Alerts Display */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : viewMode === 'cards' ? (
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">check_circle</span>
                <p className="text-sm">No alerts matching your filters</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={dismissAlert}
                  onAcknowledge={() => acknowledgeAlert(alert.id)}
                />
              ))
            )}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredAlerts}
            loading={loading}
            emptyMessage="No alerts found."
          />
        )}
      </div>
    </div>
  );
}
