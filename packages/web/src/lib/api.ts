const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('artvault_token');
}

export function setToken(token: string) {
  localStorage.setItem('artvault_token', token);
}

export function clearToken() {
  localStorage.removeItem('artvault_token');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers, ...options });

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new ApiError(401, 'Unauthorized');
    }
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (password: string) =>
      request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
    verify: () => request<{ valid: boolean }>('/auth/verify', { method: 'POST' }),
  },
  artPieces: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/art-pieces${qs}`);
    },
    get: (id: string) => request<any>(`/art-pieces/${id}`),
    create: (data: any) =>
      request<any>('/art-pieces', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/art-pieces/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/art-pieces/${id}`, { method: 'DELETE' }),
    toggleFavorite: (id: string) =>
      request<any>(`/art-pieces/${id}/favorite`, { method: 'PATCH' }),
    tags: () => request<string[]>('/art-pieces/tags'),
    reorder: (ids: string[]) =>
      request<any>('/art-pieces/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
    stats: () => request<any>('/art-pieces/stats'),
  },
  collections: {
    list: () => request<any[]>('/collections'),
    get: (id: string) => request<any>(`/collections/${id}`),
    create: (data: any) =>
      request<any>('/collections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/collections/${id}`, { method: 'DELETE' }),
  },
};
