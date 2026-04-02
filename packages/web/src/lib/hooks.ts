'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getToken } from './api';

// ─── Auth ────────────────────────────────────────────────────────────────────

export function useAuth() {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: () => api.auth.me(),
    staleTime: 10 * 60_000, // 10 minutes — session is stable
    gcTime: 30 * 60_000,
    retry: false,
    enabled: !!getToken(),
  });
}

// ─── Art Pieces ──────────────────────────────────────────────────────────────

export function useArtPieces(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['art-pieces', params],
    queryFn: () => api.artPieces.list(params),
    staleTime: 30_000,
  });
}

export function useArtPiece(id: string) {
  return useQuery({
    queryKey: ['art-piece', id],
    queryFn: () => api.artPieces.get(id),
    enabled: !!id,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api.artPieces.tags(),
    staleTime: 5 * 60_000, // tags rarely change
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.artPieces.stats(),
    staleTime: 60_000,
  });
}

export function useDailyHighlight() {
  return useQuery({
    queryKey: ['daily-highlight'],
    queryFn: () => api.artPieces.dailyHighlight(),
    staleTime: 60 * 60_000, // 1 hour — changes daily
  });
}

export function useTimeline() {
  return useQuery({
    queryKey: ['timeline'],
    queryFn: () => api.artPieces.timeline(),
  });
}

export function useRelated(id: string) {
  return useQuery({
    queryKey: ['related', id],
    queryFn: () => api.artPieces.related(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}

// ─── Collections ─────────────────────────────────────────────────────────────

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: () => api.collections.list(),
    staleTime: 2 * 60_000,
  });
}

export function useCollectionTree() {
  return useQuery({
    queryKey: ['collections-tree'],
    queryFn: () => api.collections.tree(),
    staleTime: 2 * 60_000,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.artPieces.toggleFavorite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['art-pieces'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteArtPiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.artPieces.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['art-pieces'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useCreateArtPiece() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => api.artPieces.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['art-pieces'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

export function useBatchDelete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.artPieces.batchDelete(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['art-pieces'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => {
    keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
}
