import { api } from './api';
import { Route, RouteStop, OptimizationResult } from '@/types/route';

export const routesService = {
  list: (date?: string) => {
    const q = date ? `?date=${date}` : '';
    return api.get<Route[]>(`/routes${q}`);
  },

  optimize: (routeId: string) =>
    api.post<OptimizationResult>('/routes/optimize', { routeId }),

  confirm: (id: string, payload: Partial<Route>) =>
    api.put<Route>(`/routes/${id}`, payload),

  stops: (id: string) => api.get<RouteStop[]>(`/routes/${id}/stops`),
};
