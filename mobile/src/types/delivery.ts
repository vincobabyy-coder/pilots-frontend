export type DeliveryStatus =
  | 'pending'
  | 'en_route'
  | 'arrived'
  | 'delivered'
  | 'failed';

export type ShipmentStatus =
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'exception';

export interface Delivery {
  id: string;
  trackingNumber: string;
  sequence: number;
  address: string;
  city: string;
  customer: string;
  customerPhone?: string;
  status: DeliveryStatus;
  eta: string;
  distance: number;
  lat: number;
  lng: number;
  notes?: string;
  isOnTime: boolean;
}

export interface RouteStop {
  id: string;
  sequence: number;
  address: string;
  customer: string;
  lat: number;
  lng: number;
  eta: string;
  status: DeliveryStatus;
}

export interface ConfirmDeliveryPayload {
  photo_base64: string;
  signature_base64: string;
  notes: string;
  lat: number;
  lng: number;
}

export interface DriverSummary {
  totalDeliveries: number;
  completedDeliveries: number;
  remainingDeliveries: number;
  totalDistance: number;
  etaMinutes: number;
  onTimePercent: number;
  earnings: number;
}

// Job types for job acceptance
export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  originAddress: Record<string, unknown>;
  destinationAddress: Record<string, unknown>;
  destLat: number;
  destLon: number;
  items: Array<{ sku: string; quantity: number; weightKg?: number; volumeCbm?: number }>;
  totalWeightKg?: number;
  totalVolumeCbm?: number;
  scheduledDeliveryDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableJob {
  id: string;
  orderId: string;
  order: Order;
  destination: string;
  destLat: number;
  destLon: number;
  distance: number;
  estimatedMinutes: number;
  pay: number;
  priority: 'normal' | 'high' | 'urgent';
  customerName?: string;
  specialInstructions?: string;
}

export interface Route {
  id: string;
  orgId: string;
  driverId?: string;
  vehicleId?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  stops: RouteStop[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  totalDistance?: number;
  totalDuration?: number;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  destinationAddress: Record<string, unknown>;
  destLat?: number;
  destLon?: number;
  assignedRouteId?: string;
  assignedDriverId?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  exceptionFlag: boolean;
  exceptionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  eventType: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
