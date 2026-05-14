import { api } from './api';

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  capacity: number;
  currentStock: number;
  utilizationPercent: number;
  staffCount: number;
}

export interface InventoryItem {
  sku: string;
  name: string;
  currentStock: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  isLowStock: boolean;
}

export interface WarehouseTransaction {
  id: string;
  type: 'in' | 'out' | 'transfer';
  sku: string;
  quantity: number;
  timestamp: string;
  reference: string;
}

export const warehousesService = {
  list: () => api.get<Warehouse[]>('/warehouses'),

  inventory: (id: string) =>
    api.get<InventoryItem[]>(`/warehouses/${id}/inventory`),

  transactions: (id: string) =>
    api.get<WarehouseTransaction[]>(`/warehouses/${id}/transactions`),

  rebalance: (fromId: string, toId: string, sku: string, quantity: number) =>
    api.post('/warehouses/rebalance', { fromId, toId, sku, quantity }),
};
