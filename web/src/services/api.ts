const BASE_URL = import.meta.env.VITE_API_URL || 'https://pilots-hq.onrender.com/api/v1';

class NetworkError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

function getToken(): string | null {
  return localStorage.getItem('pilots_token');
}

function setToken(token: string): void {
  localStorage.setItem('pilots_token', token);
}

function getRefreshToken(): string | null {
  return localStorage.getItem('pilots_refresh_token');
}

// All backend responses are wrapped: { success, data, meta }
// This unwraps and returns data, or throws on error.
async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null) as {
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
  } | null;

  if (!res.ok) {
    throw new NetworkError(
      body?.error?.message ?? `HTTP ${res.status}`,
      res.status,
      body
    );
  }

  // Return the unwrapped data payload
  return (body?.data ?? body) as T;
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new NetworkError('No refresh token', 401);

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem('pilots_token');
    localStorage.removeItem('pilots_refresh_token');
    window.dispatchEvent(new CustomEvent('pilots:logout'));
    throw new NetworkError('Session expired', 401);
  }

  // Backend returns { data: { accessToken, refreshToken, expiresIn } }
  const data = await parseResponse<{ accessToken: string; refreshToken: string }>(res);
  setToken(data.accessToken);
  localStorage.setItem('pilots_refresh_token', data.refreshToken);
  return data.accessToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !isRetry) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return parseResponse<T>(retryRes);
    } catch {
      throw new NetworkError('Unauthorized', 401);
    }
  }

  return parseResponse<T>(res);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  setToken,
  getToken,
};

export { NetworkError };
