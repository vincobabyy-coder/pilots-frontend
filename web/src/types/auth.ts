export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'dispatcher' | 'manager';
  avatar?: string;
  organizationId: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; token: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_TOKEN'; payload: { token: string } }
  | { type: 'SET_LOADING'; payload: boolean };
