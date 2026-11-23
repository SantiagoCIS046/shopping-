import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  api,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '../api/client';

export type AuthUser = { id: string; name: string; email: string; isAdmin?: boolean };

type AuthResponse = { token: string; refreshToken: string; user: AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  /** true mientras revisa si hay sesión guardada al abrir la app */
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Sesión de usuario. Los tokens (access corto + refresh) viven en el llavero
 * del dispositivo (expo-secure-store); el login solo se pide una vez y el
 * cliente renueva el access token automáticamente cuando expira.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Restaura la sesión guardada al abrir la app
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const data = await api<{ user: AuthUser }>('/auth/me');
        if (!cancelled) setUser(data.user);
      } catch {
        await clearAuthTokens().catch(() => undefined);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async (data: AuthResponse) => {
    await setAuthTokens({ token: data.token, refreshToken: data.refreshToken });
    setUser(data.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const data = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
        skipAuth: true,
      });
      await persist(data);
    },
    [persist],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: { name, email, password },
        skipAuth: true,
      });
      await persist(data);
    },
    [persist],
  );

  const signOut = useCallback(async () => {
    // Revoca el refresh token en el servidor (mejor esfuerzo)
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api('/auth/logout', {
          method: 'POST',
          body: { refreshToken },
          skipAuth: true,
        });
      }
    } catch {
      // Si el servidor no responde, igual se borra la sesión local
    }
    await clearAuthTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, restoring, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
