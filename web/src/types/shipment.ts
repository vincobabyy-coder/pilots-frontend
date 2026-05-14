import { Address } from './order';

export type ShipmentStatus =
  | 'created'
  | 'picked'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

export interface Shipment {
  id: string;
  trackingNumber: string;
  orderId: string;
  destination: Address;
  status: ShipmentStatus;
  priority: 'standard' | 'express' | 'urgent';
  driverId?: string;
  driverName?: string;
  warehouseId: string;
  warehouseName: string;
  eta?: string;
  distance?: number;
  lastEvent?: ShipmentEvent;
  currentLocation?: { lat: number; lng: number };
  createdAt: string;
  updatedAt: string;
  exception?: ShipmentException;
}

export interface ShipmentEvent {
  id: string;
  shipmentId: string;
  type: string;
  description: string;
  location?: string;
  lat?: number;
  lng?: number;
  timestamp: string;
  createdBy?: string;
}

export interface ShipmentException {
  type: 'late' | 'failed_attempt' | 'exception' | 'fraud';
  description: string;
  detectedAt: string;
}

export interface ShipmentListParams {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  priority?: string;
  warehouseId?: string;
  driverId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}
