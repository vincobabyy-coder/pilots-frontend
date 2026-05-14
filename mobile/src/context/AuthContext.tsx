import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, AuthAction, MobileUser } from '@/types/auth';
import { mobileApi, setToken, clearToken } from '@/services/api';
import { mobileWs } from '@/services/websocket';
import { flushQueue } from '@/services/offlineQueue';

const TOKEN_KEY = 'pilots_token';

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { user: null, token: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Rehydrate on app start
    AsyncStorage.getItem(TOKEN_KEY).then(async (token) => {
      if (token) {
        try {
          const user = await mobileApi.get<MobileUser>('/drivers/me');
          dispatch({ type: 'LOGIN', payload: { user, token } });
          mobileWs.connect(token);
          flushQueue().catch(() => null);
        } catch {
          await clearToken();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await mobileApi.post<{ token: string; user: MobileUser }>('/auth/login', {
      email,
      password,
    });
    await setToken(res.token);
    dispatch({ type: 'LOGIN', payload: { user: res.user, token: res.token } });
    mobileWs.connect(res.token);
    flushQueue().catch(() => null);
  }, []);

  const logout = useCallback(async () => {
    mobileApi.post('/auth/logout').catch(() => null);
    await clearToken();
    mobileWs.disconnect();
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
