'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ArtCard } from '@/components/art-card';
import { Lightbox } from '@/components/lightbox';
import { useToast } from '@/components/toast';

export default function DiscoverPage() {
  const { toast } = useToast();
  const [pieces, setPieces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const shuffle = () => {
    setLoading(true);
    api.artPieces
      .discover(30)
      .then(setPieces)
      .catch((err) => toast(err.message || 'Failed', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { shuffle(); }, []);

  const selectedPiece = selectedIndex !== null ? pieces[selectedIndex] : null;

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-themed">Discover</h1>
          <p className="mt-1 text-sm text-themed-secondary">Rediscover pieces from your vault in a random order</p>
        </div>
        <button
          onClick={shuffle}
          disabled={loading}
          className="rounded-lg accent-bg px-5 py-2.5 font-medium text-white accent-bg-hover disabled:opacity-50"
        >
          Shuffle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      ) : pieces.length === 0 ? (
        <p className="py-20 text-center text-xl text-themed-muted">No pieces yet</p>
      ) : (
        <div className="masonry">
          {pieces.map((piece, i) => (
            <ArtCard
              key={piece.id}
              piece={piece}
              index={i}
              onOpen={(id) => {
                const idx = pieces.findIndex((p) => p.id === id);
                if (idx !== -1) setSelectedIndex(idx);
              }}
            />
          ))}
        </div>
      )}

      <Lightbox
        piece={selectedPiece}
        onClose={() => setSelectedIndex(null)}
        onPrev={() => selectedIndex !== null && selectedIndex > 0 && setSelectedIndex(selectedIndex - 1)}
        onNext={() => selectedIndex !== null && selectedIndex < pieces.length - 1 && setSelectedIndex(selectedIndex + 1)}
        hasPrev={selectedIndex !== null && selectedIndex > 0}
        hasNext={selectedIndex !== null && selectedIndex < pieces.length - 1}
      />
    </div>
  );
}
