'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { ArtCard } from '@/components/art-card';
import { Lightbox } from '@/components/lightbox';

export default function GalleryPage() {
  const [pieces, setPieces] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadPieces = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (activeTag) params.tag = activeTag;
    const res = await api.artPieces.list(params);
    setPieces(res.data);
    setLoading(false);
  }, [activeTag]);

  useEffect(() => {
    loadPieces();
    api.artPieces.tags().then(setTags);
  }, [loadPieces]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this piece?')) return;
    await api.artPieces.delete(id);
    loadPieces();
  };

  const handleOpen = async (id: string) => {
    const piece = await api.artPieces.get(id);
    setSelectedPiece(piece);
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Gallery</h1>
        <p className="mt-2 text-neutral-400">Your curated collection of art, videos, and media</p>
      </div>

      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !activeTag
                ? 'bg-pink-500 text-white'
                : 'bg-white/5 text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tag === activeTag
                  ? 'bg-pink-500 text-white'
                  : 'bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
        </div>
      ) : pieces.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-xl text-neutral-500">No art pieces yet</p>
          <a
            href="/add"
            className="mt-4 inline-block rounded-lg bg-pink-500 px-6 py-2.5 font-medium text-white hover:bg-pink-600"
          >
            Add your first piece
          </a>
        </div>
      ) : (
        <div className="masonry">
          {pieces.map((piece) => (
            <ArtCard
              key={piece.id}
              piece={piece}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Lightbox piece={selectedPiece} onClose={() => setSelectedPiece(null)} />
    </>
  );
}
