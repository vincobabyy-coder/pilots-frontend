import { api } from './api';
import { Order, CreateOrderPayload, OrderListParams, PaginatedResponse } from '@/types/order';

export const ordersService = {
  list: (params: OrderListParams = {}) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return api.get<PaginatedResponse<Order>>(`/orders${q ? `?${q}` : ''}`);
  },

  create: (payload: CreateOrderPayload) =>
    api.post<Order>('/orders', payload),

  detail: (id: string) => api.get<Order>(`/orders/${id}`),

  update: (id: string, payload: Partial<Order>) =>
    api.put<Order>(`/orders/${id}`, payload),

  allocate: (ids: string[]) =>
    api.post<{ allocated: number }>('/orders/allocate', { ids }),

  reassign: (id: string, driverId: string) =>
    api.patch<Order>(`/orders/${id}`, { allocationDetails: { driverId } }),

  reschedule: (id: string, deliveryDate: string) =>
    api.patch<Order>(`/orders/${id}`, { deliveryDate }),

  optimize: (ids: string[]) =>
    api.post<{ routes: unknown }>('/orders/optimize', { ids }),

  bulk: (csvFile: File) => {
    const formData = new FormData();
    formData.append('file', csvFile);
    return fetch(`${import.meta.env.VITE_API_URL}/orders/bulk`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('pilots_token') ?? ''}`,
      },
      body: formData,
    }).then((r) => r.json() as Promise<{ created: number; errors: string[] }>);
  },
};
