export type OrderStatus =
  | 'created'
  | 'allocated'
  | 'picked'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  destination: Address;
  status: OrderStatus;
  warehouseId: string;
  warehouseName: string;
  sku: string;
  quantity: number;
  priority: 'standard' | 'express' | 'urgent';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  allocationDetails?: AllocationDetails;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface AllocationDetails {
  driverId: string;
  driverName: string;
  vehicleId: string;
  routeId: string;
  allocatedAt: string;
}

export interface CreateOrderPayload {
  customer: string;
  destination: Address;
  sku: string;
  quantity: number;
  warehouseId: string;
  priority: 'standard' | 'express' | 'urgent';
  notes?: string;
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  warehouseId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
