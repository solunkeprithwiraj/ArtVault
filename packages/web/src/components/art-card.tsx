'use client';

import { MediaRenderer } from './media-renderer';

interface ArtCardProps {
  piece: {
    id: string;
    title: string;
    description?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
    sourceUrl: string;
    tags: string[];
    collection?: { name: string } | null;
  };
  onOpen?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ArtCard({ piece, onOpen, onDelete }: ArtCardProps) {
  return (
    <div className="masonry-item group relative overflow-hidden rounded-xl bg-neutral-900 border border-white/5 transition-all hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/5">
      <div className="cursor-pointer" onClick={() => onOpen?.(piece.id)}>
        <MediaRenderer
          mediaType={piece.mediaType}
          sourceUrl={piece.sourceUrl}
          title={piece.title}
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{piece.title}</h3>
        {piece.description && (
          <p className="mt-1 text-sm text-neutral-400 line-clamp-2">{piece.description}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {piece.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-neutral-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {piece.collection && (
          <p className="mt-2 text-xs text-pink-400">{piece.collection.name}</p>
        )}
      </div>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(piece.id);
          }}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-neutral-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
