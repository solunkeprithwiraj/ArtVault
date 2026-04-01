'use client';

import { useEffect, useCallback } from 'react';
import { MediaRenderer } from './media-renderer';

interface LightboxProps {
  piece: {
    title: string;
    description?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'IFRAME';
    sourceUrl: string;
    tags: string[];
  } | null;
  onClose: () => void;
}

export function Lightbox({ piece, onClose }: LightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!piece) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [piece, handleKeyDown]);

  if (!piece) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 z-10 rounded-full bg-neutral-800 p-2 text-white hover:bg-neutral-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="overflow-hidden rounded-xl bg-neutral-900">
          <MediaRenderer
            mediaType={piece.mediaType}
            sourceUrl={piece.sourceUrl}
            title={piece.title}
            className="max-h-[70vh] object-contain"
          />
          <div className="p-6">
            <h2 className="text-xl font-bold">{piece.title}</h2>
            {piece.description && (
              <p className="mt-2 text-neutral-400">{piece.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {piece.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-pink-500/10 px-3 py-1 text-sm text-pink-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
