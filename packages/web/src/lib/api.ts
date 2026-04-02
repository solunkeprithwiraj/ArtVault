const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function getToken(): string | null {
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
      if (typeof window !== 'undefined' && !['/login', '/signup'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
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
    signup: (username: string, password: string) =>
      request<{ token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    login: (username: string, password: string) =>
      request<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    verify: () => request<{ valid: boolean }>('/auth/verify', { method: 'POST' }),
    me: () => request<{ id: string; username: string; role: string; createdAt: string }>('/auth/me'),
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
    tags: () => request<Array<{ name: string; count: number }>>('/art-pieces/tags'),
    reorder: (ids: string[]) =>
      request<any>('/art-pieces/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
    stats: () => request<any>('/art-pieces/stats'),
    random: () => request<any>('/art-pieces/random'),
    dailyHighlight: () => request<any>('/art-pieces/daily-highlight'),
    discover: (limit?: number) => request<any[]>(`/art-pieces/discover${limit ? `?limit=${limit}` : ''}`),
    related: (id: string) => request<any[]>(`/art-pieces/${id}/related`),
    togglePin: (id: string) => request<any>(`/art-pieces/${id}/pin`, { method: 'PATCH' }),
    checkDuplicate: (url: string) =>
      request<any>(`/art-pieces/check-duplicate?url=${encodeURIComponent(url)}`),
    checkLinks: () => request<any>('/art-pieces/check-links'),
    timeline: () => request<any[]>('/art-pieces/timeline'),
    batchDelete: (ids: string[]) =>
      request<any>('/art-pieces/batch/delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    batchMove: (ids: string[], collectionId: string | null) =>
      request<any>('/art-pieces/batch/move', { method: 'POST', body: JSON.stringify({ ids, collectionId }) }),
    batchTag: (ids: string[], tags: string[], mode: 'add' | 'set') =>
      request<any>('/art-pieces/batch/tag', { method: 'POST', body: JSON.stringify({ ids, tags, mode }) }),
  },
  collections: {
    list: () => request<any[]>('/collections'),
    tree: () => request<any[]>('/collections/tree'),
    get: (id: string) => request<any>(`/collections/${id}`),
    create: (data: any) =>
      request<any>('/collections', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/collections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/collections/${id}`, { method: 'DELETE' }),
  },
  notes: {
    list: (artPieceId: string) => request<any[]>(`/art-pieces/${artPieceId}/notes`),
    create: (artPieceId: string, content: string) =>
      request<any>(`/art-pieces/${artPieceId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    update: (artPieceId: string, noteId: string, content: string) =>
      request<any>(`/art-pieces/${artPieceId}/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    delete: (artPieceId: string, noteId: string) =>
      request<void>(`/art-pieces/${artPieceId}/notes/${noteId}`, { method: 'DELETE' }),
  },
  scrape: (url: string) =>
    request<{
      pageTitle: string;
      media: Array<{ type: 'IMAGE' | 'IFRAME'; url: string; thumbnail?: string; title?: string }>;
    }>('/scrape', { method: 'POST', body: JSON.stringify({ url }) }),
  proxyUrl: (url: string, opts?: { w?: number; h?: number; q?: number; format?: string }) => {
    const params = new URLSearchParams({ url });
    if (opts?.w) params.set('w', String(opts.w));
    if (opts?.h) params.set('h', String(opts.h));
    if (opts?.q) params.set('q', String(opts.q));
    if (opts?.format) params.set('format', opts.format);
    return `${API_BASE}/proxy?${params.toString()}`;
  },
};
