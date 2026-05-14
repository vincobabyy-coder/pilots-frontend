export interface KpiData {
  activeDeliveries: number;
  activeDeliveriesDelta: number;
  onTimePercent: number;
  onTimeDelta: number;
  fleetUtilization: number;
  fleetUtilizationDelta: number;
  revenueToday: number;
  revenueDelta: number;
  avgDeliveryTime: number;
  totalDistance: number;
  totalDeliveries: number;
  fraudAlerts: number;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast: number;
  lower: number;
  upper: number;
}

export interface TimeseriesPoint {
  hour: number;
  deliveries: number;
  onTime: number;
  late: number;
  performance: 'good' | 'warning' | 'critical';
}

export interface AnomalyCell {
  warehouseId: string;
  warehouseName: string;
  metric: string;
  score: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface AnomalyMatrix {
  warehouses: string[];
  metrics: string[];
  cells: AnomalyCell[];
}

export interface DriverLeaderboardEntry {
  rank: number;
  driverId: string;
  driverName: string;
  avatar?: string;
  onTimePercent: number;
  deliveries: number;
  rating: number;
}

export interface RouteAnalytics {
  routeId: string;
  driverName: string;
  date: string;
  stops: number;
  completed: number;
  distance: number;
  duration: number;
  onTimePercent: number;
}

export interface AlertItem {
  id: string;
  type: 'late_delivery' | 'offline_driver' | 'warehouse_capacity' | 'fraud' | 'exception';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  count?: number;
  entityId?: string;
  createdAt: string;
  acknowledged: boolean;
}

export type TimeRange = 'today' | 'week' | 'month' | 'custom';
