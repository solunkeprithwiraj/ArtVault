const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
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
    tags: () => request<string[]>('/art-pieces/tags'),
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
