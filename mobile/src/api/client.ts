import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const ACCESS_KEY = 'shopping.auth.token';
const REFRESH_KEY = 'shopping.auth.refresh';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type AuthTokens = { token: string; refreshToken: string };

// ---------- Almacén seguro de tokens (llavero del dispositivo) ----------

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_KEY);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function setAuthTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, tokens.token);
  await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => undefined);
  await SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => undefined);
}

// ---------- Cliente HTTP ----------

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Token explícito; si no, usa el guardado. */
  token?: string | null;
  /** true para no adjuntar tokens ni intentar refresh (login, registro...). */
  skipAuth?: boolean;
};

async function request(path: string, options: ApiOptions, accessToken: string | null): Promise<Response> {
  return fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

// Un solo refresh a la vez aunque varias llamadas fallen a la vez (single-flight)
let refreshPromise: Promise<boolean> | null = null;

/** Rota el refresh token y guarda la sesión nueva. false si no se pudo. */
async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = await getRefreshToken();
      if (!refresh) return false;
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!res.ok) {
          await clearAuthTokens();
          return false;
        }
        const data = (await res.json()) as AuthTokens;
        await setAuthTokens(data);
        return true;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Cliente HTTP contra el backend.
 * - Fuera de desarrollo exige HTTPS (regla de seguridad).
 * - Si el access token expiró (401), rota el refresh token y reintenta una vez.
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  // Regla de seguridad: las credenciales nunca viajan en texto plano en producción
  if (!__DEV__ && !API_URL.startsWith('https://')) {
    throw new ApiError(0, 'La API debe servirse por HTTPS en producción');
  }

  let res: Response;
  try {
    const token = options.skipAuth ? null : (options.token ?? (await getAccessToken()));
    res = await request(path, options, token);

    if (res.status === 401 && !options.skipAuth) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        res = await request(path, options, await getAccessToken());
      }
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'No pudimos conectar con el servidor. ¿Está encendido el backend?');
  }

  const data: unknown = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data === 'object' && data !== null && 'error' in data && typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Error ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}
