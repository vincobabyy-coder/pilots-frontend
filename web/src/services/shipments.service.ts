import { api } from './api';
import { Shipment, ShipmentListParams, ShipmentEvent } from '@/types/shipment';
import { PaginatedResponse } from '@/types/order';

export const shipmentsService = {
  list: (params: ShipmentListParams = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<PaginatedResponse<Shipment>>(`/shipments${q ? `?${q}` : ''}`);
  },

  detail: (id: string) =>
    api.get<Shipment & { events: ShipmentEvent[] }>(`/shipments/${id}`),

  update: (id: string, payload: Partial<Shipment>) =>
    api.put<Shipment>(`/shipments/${id}`, payload),

  reassign: (id: string, driverId: string) =>
    api.post<Shipment>(`/shipments/${id}/reassign`, { driverId }),

  track: (trackingNumber: string) =>
    api.get<Shipment & { events: ShipmentEvent[] }>(
      `/tracking/${trackingNumber}`
    ),
};
