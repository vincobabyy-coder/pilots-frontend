export type RouteStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface Route {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  status: RouteStatus;
  date: string;
  stops: RouteStop[];
  totalStops: number;
  completedStops: number;
  totalDistance: number;
  estimatedDuration: number;
  actualDuration?: number;
  startedAt?: string;
  completedAt?: string;
  polyline?: [number, number][];
  color?: string;
}

export interface RouteStop {
  id: string;
  routeId: string;
  shipmentId: string;
  trackingNumber: string;
  sequence: number;
  address: string;
  customer: string;
  lat: number;
  lng: number;
  eta: string;
  status: 'pending' | 'arrived' | 'delivered' | 'failed';
  completedAt?: string;
  distance?: number;
}

export interface OptimizationResult {
  routeId: string;
  before: {
    totalDistance: number;
    estimatedDuration: number;
  };
  after: {
    totalDistance: number;
    estimatedDuration: number;
    stops: RouteStop[];
  };
  savings: {
    distance: number;
    time: number;
    percent: number;
  };
}
