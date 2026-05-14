export type TrackingStatus =
  | 'created'
  | 'picked'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered';

export interface TrackingDriver {
  name: string;
  phone?: string;
  vehicle: string;
  avatar?: string;
}

export interface TrackingEvent {
  id: string;
  type: string;
  description: string;
  location?: string;
  timestamp: string;
  lat?: number;
  lng?: number;
}

export interface PublicTracking {
  trackingNumber: string;
  orderId: string;
  customer: string;
  destination: {
    address: string;
    city: string;
    lat: number;
    lng: number;
  };
  origin: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  status: TrackingStatus;
  eta?: string;
  currentLocation?: { lat: number; lng: number };
  distance?: number;
  driver?: TrackingDriver;
  events: TrackingEvent[];
  orderDate: string;
}
