import { api } from './api';
import { Driver, DriverPerformance, DriverDelivery, DriverLocation } from '@/types/driver';

export const driversService = {
  roster: () => api.get<Driver[]>('/drivers'),

  detail: (id: string) => api.get<Driver>(`/drivers/${id}`),

  deliveries: (id: string) =>
    api.get<DriverDelivery[]>(`/drivers/${id}/deliveries`),

  performance: (id: string) =>
    api.get<DriverPerformance>(`/drivers/${id}/performance`),

  locations: () => api.get<DriverLocation[]>('/drivers/locations'),
};
