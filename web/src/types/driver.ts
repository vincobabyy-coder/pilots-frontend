export type DriverStatus = 'active' | 'offline' | 'waiting' | 'on_break';

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  status: DriverStatus;
  vehicleId: string;
  vehicleType: string;
  vehiclePlate: string;
  currentLocation?: { lat: number; lng: number };
  currentDeliveries: number;
  onTimePercent: number;
  rating: number;
  createdAt: string;
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface DriverPerformance {
  driverId: string;
  period: string;
  totalDeliveries: number;
  onTimeDeliveries: number;
  onTimePercent: number;
  totalDistance: number;
  avgDeliveryTime: number;
  earnings: number;
  rating: number;
  failedDeliveries: number;
}

export interface DriverDelivery {
  id: string;
  trackingNumber: string;
  destination: string;
  status: string;
  completedAt?: string;
  onTime: boolean;
}
