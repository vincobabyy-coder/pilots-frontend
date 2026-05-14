import { api } from './api';
import { User, LoginPayload, TokenResponse } from '@/types/auth';

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<TokenResponse>('/auth/login', payload),

  logout: () => api.post<void>('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<{ token: string }>('/auth/refresh', { refreshToken }),

  me: () => api.get<User>('/auth/me'),
};
