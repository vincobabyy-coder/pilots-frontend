export interface MobileUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar?: string;
  vehicleId: string;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
}

export interface AuthState {
  user: MobileUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AuthAction =
  | { type: 'LOGIN'; payload: { user: MobileUser; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };
