import { api } from './api';
import {
  KpiData,
  ForecastPoint,
  TimeseriesPoint,
  AnomalyMatrix,
  DriverLeaderboardEntry,
  RouteAnalytics,
  AlertItem,
  TimeRange,
} from '@/types/analytics';

export const analyticsService = {
  kpis: () => api.get<KpiData>('/analytics/kpis'),

  forecasts: (range: TimeRange = 'week') =>
    api.get<ForecastPoint[]>(`/analytics/forecasts?range=${range}`),

  timeseries: (range: TimeRange = 'today') =>
    api.get<TimeseriesPoint[]>(`/analytics/timeseries?range=${range}`),

  anomalies: () => api.get<AlertItem[]>('/analytics/anomalies'),

  anomalyMatrix: () => api.get<AnomalyMatrix>('/analytics/anomalies?format=matrix'),

  leaderboard: () =>
    api.get<DriverLeaderboardEntry[]>('/analytics/drivers/leaderboard'),

  routes: (range: TimeRange = 'today') =>
    api.get<RouteAnalytics[]>(`/analytics/routes?range=${range}`),
};
