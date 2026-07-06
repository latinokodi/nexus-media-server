import type { MediaGroup, MediaContext, ServerSettings } from './types';

const BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '') : '';

function getToken(): string {
  return localStorage.getItem('media_token') || '';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('media_token');
    window.location.hash = '#/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<string>('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  getMedia: (parentId?: string, recursive?: boolean) => {
    const params = new URLSearchParams();
    if (parentId) params.set('parent_id', parentId);
    if (recursive) params.set('recursive', 'true');
    return request<MediaGroup[]>(`/api/media?${params}`);
  },

  getThumbnailUrl: (id: string): string =>
    `${BASE}/api/media/${id}/thumbnail?token=${getToken()}`,

  getStreamUrl: (id: string): string =>
    `${BASE}/api/media/${id}/stream/direct?token=${getToken()}`,

  getMediaContext: (id: string) =>
    request<MediaContext>(`/api/media/${id}/context`),

  getProgress: (id: string) =>
    request<{ progress: number }>(`/api/media/${id}/progress`),

  updateProgress: (id: string, progress: number, duration: number) =>
    request<void>(`/api/media/${id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress, duration }),
    }),

  getFavorites: () => request<MediaGroup[]>('/api/favorites'),

  addFavorite: (id: string) =>
    request<void>(`/api/favorites/${id}`, { method: 'POST' }),

  removeFavorite: (id: string) =>
    request<void>(`/api/favorites/${id}`, { method: 'DELETE' }),

  getSettings: () => request<ServerSettings>('/api/settings'),

  updateSettings: (settings: Partial<ServerSettings>) =>
    request<void>('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }),

  listDirectories: (path?: string) =>
    request<{ name: string; path: string }[]>(
      `/api/settings/list-directories${path ? `?path=${encodeURIComponent(path)}` : ''}`
    ),
};
