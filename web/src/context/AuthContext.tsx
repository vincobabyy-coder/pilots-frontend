import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from 'react';
import { AuthState, AuthAction, User, LoginPayload } from '@/types/auth';
import { api } from '@/services/api';
import { wsClient } from '@/services/websocket';

const TOKEN_KEY = 'pilots_token';
const REFRESH_KEY = 'pilots_refresh_token';

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'REFRESH_TOKEN':
      return { ...state, token: action.payload.token };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_KEY);

    if (token) {
      api
        .get<User>('/auth/me')
        .then((user) => {
          dispatch({
            type: 'LOGIN',
            payload: { user, token, refreshToken: refreshToken ?? '' },
          });
          wsClient.connect(token);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_KEY);
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    // Listen for forced logout (401 with no refresh)
    const handleForceLogout = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('pilots:logout', handleForceLogout);
    return () => window.removeEventListener('pilots:logout', handleForceLogout);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    // Backend returns { accessToken, refreshToken, expiresIn }
    const res = await api.post<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>('/auth/login', payload);

    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);

    // Fetch the user profile now that the token is stored
    const user = await api.get<User>('/auth/me');

    dispatch({
      type: 'LOGIN',
      payload: { user, token: res.accessToken, refreshToken: res.refreshToken },
    });

    wsClient.connect(res.accessToken);
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    wsClient.disconnect();
    dispatch({ type: 'LOGOUT' });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
