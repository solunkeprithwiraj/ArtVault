'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function useArtPieces(params?: Record<string, string>) {
  const key = ['art-pieces', params];
  return useQuery({
    queryKey: key,
    queryFn: () => api.artPieces.list(params),
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
    staleTime: 60_000,
  });
}

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: () => api.collections.list(),
    staleTime: 60_000,
  });
}

export function useCollectionTree() {
  return useQuery({
    queryKey: ['collections-tree'],
    queryFn: () => api.collections.tree(),
    staleTime: 60_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.artPieces.stats(),
  });
}

export function useTimeline() {
  return useQuery({
    queryKey: ['timeline'],
    queryFn: () => api.artPieces.timeline(),
  });
}

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
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) => {
    keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
}
